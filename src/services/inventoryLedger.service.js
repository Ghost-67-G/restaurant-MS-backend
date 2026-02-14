/* eslint-disable no-await-in-loop */
const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { InventoryLedger, Ingredient } = require('../models');
const ApiError = require('../utils/ApiError');
const stockAlertService = require('./stockAlert.service');
const logger = require('../config/logger');

/**
 * Check if MongoDB supports transactions (requires replica set)
 * @returns {Promise<boolean>}
 */
const supportsTransactions = async () => {
  try {
    const admin = mongoose.connection.db.admin();
    const info = await admin.replSetGetStatus();
    return !!info;
  } catch {
    return false;
  }
};

/**
 * Create a ledger entry and update ingredient stock
 * Uses transaction if available (replica set), otherwise falls back to non-transactional
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
  const useTransaction = await supportsTransactions();

  if (useTransaction) {
    return createLedgerEntryWithTransaction(ledgerData);
  }
  return createLedgerEntryWithoutTransaction(ledgerData);
};

/**
 * Create ledger entry WITH MongoDB transaction (replica set required)
 */
const createLedgerEntryWithTransaction = async (ledgerData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const ingredient = await Ingredient.findById(ledgerData.ingredientId).session(session);

    if (!ingredient) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Ingredient not found');
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

    await session.commitTransaction();

    stockAlertService.checkIngredientStock(ingredient.id).catch((err) => {
      logger.error('Error checking stock alert:', err);
    });

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
 * Create ledger entry WITHOUT transaction (standalone MongoDB fallback)
 */
const createLedgerEntryWithoutTransaction = async (ledgerData) => {
  const ingredient = await Ingredient.findById(ledgerData.ingredientId);

  if (!ingredient) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Ingredient not found');
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

  const ledgerEntry = await InventoryLedger.create({
    ...ledgerData,
    balanceAfter: newStock,
  });

  ingredient.currentStock = newStock;
  await ingredient.save();

  stockAlertService.checkIngredientStock(ingredient.id).catch((err) => {
    logger.error('Error checking stock alert:', err);
  });

  return {
    ledger: ledgerEntry,
    ingredient,
  };
};

/**
 * Create multiple ledger entries
 * Uses transaction if available (replica set), otherwise falls back to non-transactional
 * @param {Array} ledgerEntries - Array of ledger entry data
 * @returns {Promise<Array>}
 */
const createBulkLedgerEntries = async (ledgerEntries) => {
  const useTransaction = await supportsTransactions();

  if (useTransaction) {
    return createBulkLedgerEntriesWithTransaction(ledgerEntries);
  }
  return createBulkLedgerEntriesWithoutTransaction(ledgerEntries);
};

/**
 * Create bulk ledger entries WITH transaction (replica set required)
 */
const createBulkLedgerEntriesWithTransaction = async (ledgerEntries) => {
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

    results.forEach((result) => {
      stockAlertService.checkIngredientStock(result.ingredient.id).catch((err) => {
        logger.error('Error checking stock alert:', err);
      });
    });

    return results;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Create bulk ledger entries WITHOUT transaction (standalone MongoDB fallback)
 */
const createBulkLedgerEntriesWithoutTransaction = async (ledgerEntries) => {
  const results = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const ledgerData of ledgerEntries) {
    const ingredient = await Ingredient.findById(ledgerData.ingredientId);

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

    const ledgerEntry = await InventoryLedger.create({
      ...ledgerData,
      balanceAfter: newStock,
    });

    ingredient.currentStock = newStock;
    await ingredient.save();

    results.push({
      ledger: ledgerEntry,
      ingredient,
    });
  }

  results.forEach((result) => {
    stockAlertService.checkIngredientStock(result.ingredient.id).catch((err) => {
      logger.error('Error checking stock alert:', err);
    });
  });

  return results;
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
