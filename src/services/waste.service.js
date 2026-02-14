const inventoryLedgerService = require('./inventoryLedger.service');
const { LEDGER_TYPE, LEDGER_REFERENCE_TYPE } = require('../config/constants');
const { InventoryLedger } = require('../models');

/**
 * Record waste for an ingredient
 * @param {Object} wasteData
 * @param {ObjectId} wasteData.ingredientId
 * @param {number} wasteData.quantity - Positive number
 * @param {string} wasteData.wasteReason - EXPIRED, BURNT, SPOILED, DAMAGED, OTHER
 * @param {string} wasteData.notes - Optional additional notes
 * @param {ObjectId} wasteData.createdBy
 * @returns {Promise<Object>}
 */
const recordWaste = async (wasteData) => {
  const { ingredientId, quantity, wasteReason, notes, createdBy } = wasteData;

  // Create ledger entry with negative quantity (waste reduces stock)
  const ledgerData = {
    ingredientId,
    type: LEDGER_TYPE.WASTE,
    quantity: -Math.abs(quantity), // Ensure it's negative
    reason: notes || wasteReason,
    referenceType: LEDGER_REFERENCE_TYPE.WASTE,
    createdBy,
  };

  const result = await inventoryLedgerService.createLedgerEntry(ledgerData);

  return {
    ...result,
    wasteReason,
  };
};

/**
 * Get waste entries for an ingredient
 * @param {ObjectId} ingredientId
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getWasteByIngredient = async (ingredientId, options = {}) => {
  return inventoryLedgerService.queryLedgerEntries(
    {
      ingredientId,
      type: LEDGER_TYPE.WASTE,
    },
    { ...options, sortBy: 'createdAt:desc' }
  );
};

/**
 * Get all waste entries with filtering
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getAllWaste = async (filter, options) => {
  return inventoryLedgerService.queryLedgerEntries(
    {
      ...filter,
      type: LEDGER_TYPE.WASTE,
    },
    options
  );
};

/**
 * Get waste statistics
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<Array>}
 */
const getWasteStats = async (startDate, endDate) => {
  const match = { type: LEDGER_TYPE.WASTE };

  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const stats = await InventoryLedger.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$ingredientId',
        totalWasted: { $sum: { $abs: '$quantity' } },
        wasteCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'ingredients',
        localField: '_id',
        foreignField: '_id',
        as: 'ingredient',
      },
    },
    {
      $unwind: '$ingredient',
    },
    {
      $project: {
        ingredientId: '$_id',
        ingredientName: '$ingredient.name',
        totalWasted: 1,
        wasteCount: 1,
      },
    },
    {
      $sort: { totalWasted: -1 },
    },
  ]);

  return stats;
};

module.exports = {
  recordWaste,
  getWasteByIngredient,
  getAllWaste,
  getWasteStats,
};
