/* eslint-disable no-await-in-loop */
const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { InventoryLedger, Ingredient } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a ledger entry and update ingredient stock in a transaction
 * @param {Object} ledgerData - Ledger entry data
 * @param {ObjectId} ledgerData.ingredientId
 * @param {string} ledgerData.type - IN, OUT, WASTE, ADJUSTMENT
 * @param {number} ledgerData.quantity - Positive for IN, negative for OUT/WASTE
 * @param {string} ledgerData.reason
 * @param {string} ledgerData.referenceType - ORDER, PURCHASE, WASTE, MANUAL
 * @param {ObjectId} ledgerData.referenceId
 * @param {ObjectId} ledgerData.createdBy
 * @returns {Promise<{ledger: InventoryLedger, ingredient: Ingredient}>}
 */
const createLedgerEntry = async (ledgerData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get the ingredient with lock
    const ingredient = await Ingredient.findById(ledgerData.ingredientId).session(session);

    if (!ingredient) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Ingredient not found');
    }

    // Calculate new stock
    const newStock = ingredient.currentStock + ledgerData.quantity;

    if (newStock < 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Insufficient stock for ${ingredient.name}. Current: ${ingredient.currentStock}, Required: ${Math.abs(
          ledgerData.quantity
        )}`
      );
    }

    // Create ledger entry
    const ledgerEntry = await InventoryLedger.create(
      [
        {
          ...ledgerData,
          balanceAfter: newStock,
        },
      ],
      { session }
    );

    // Update ingredient stock
    ingredient.currentStock = newStock;
    await ingredient.save({ session });

    // Commit transaction
    await session.commitTransaction();

    return {
      ledger: ledgerEntry[0],
      ingredient,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Create multiple ledger entries in a single transaction
 * @param {Array} ledgerEntries - Array of ledger entry data
 * @returns {Promise<Array>}
 */
const createBulkLedgerEntries = async (ledgerEntries) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const results = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const ledgerData of ledgerEntries) {
      const ingredient = await Ingredient.findById(ledgerData.ingredientId).session(session);

      if (!ingredient) {
        throw new ApiError(httpStatus.NOT_FOUND, `Ingredient not found: ${ledgerData.ingredientId}`);
      }

      const newStock = ingredient.currentStock + ledgerData.quantity;

      if (newStock < 0) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Insufficient stock for ${ingredient.name}. Current: ${ingredient.currentStock}, Required: ${Math.abs(
            ledgerData.quantity
          )}`
        );
      }

      const ledgerEntry = await InventoryLedger.create(
        [
          {
            ...ledgerData,
            balanceAfter: newStock,
          },
        ],
        { session }
      );

      ingredient.currentStock = newStock;
      await ingredient.save({ session });

      results.push({
        ledger: ledgerEntry[0],
        ingredient,
      });
    }

    await session.commitTransaction();
    return results;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Query ledger entries
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryLedgerEntries = async (filter, options) => {
  const ledgerEntries = await InventoryLedger.paginate(filter, {
    ...options,
    populate: 'ingredientId createdBy',
  });
  return ledgerEntries;
};

/**
 * Get ledger entries for a specific ingredient
 * @param {ObjectId} ingredientId
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getLedgerByIngredient = async (ingredientId, options = {}) => {
  return queryLedgerEntries({ ingredientId }, { ...options, sortBy: 'createdAt:desc' });
};

/**
 * Get ledger entry by id
 * @param {ObjectId} id
 * @returns {Promise<InventoryLedger>}
 */
const getLedgerEntryById = async (id) => {
  return InventoryLedger.findById(id).populate('ingredientId createdBy');
};

/**
 * Get ledger statistics for an ingredient
 * @param {ObjectId} ingredientId
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<Object>}
 */
const getLedgerStats = async (ingredientId, startDate, endDate) => {
  const match = { ingredientId: new mongoose.Types.ObjectId(ingredientId) };

  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const stats = await InventoryLedger.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$type',
        totalQuantity: { $sum: '$quantity' },
        count: { $sum: 1 },
      },
    },
  ]);

  return stats;
};

module.exports = {
  createLedgerEntry,
  createBulkLedgerEntries,
  queryLedgerEntries,
  getLedgerByIngredient,
  getLedgerEntryById,
  getLedgerStats,
};
