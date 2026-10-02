/* eslint-disable no-await-in-loop, no-use-before-define */
const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { InventoryLedger, Inventory } = require('../models');
const ApiError = require('../utils/ApiError');
const stockAlertService = require('./stockAlert.service');
const logger = require('../config/logger');
const { validateOrganizationId, buildOrganizationFilter, safeFindOne } = require('../utils/organizationGuard');

const normalizeLedgerEntry = (organizationId, ledgerData) => ({
  ...ledgerData,
  organizationId: validateOrganizationId(organizationId),
});

const normalizeLedgerEntries = (organizationId, ledgerEntries) => {
  validateOrganizationId(organizationId);
  return ledgerEntries.map((ledgerData) => normalizeLedgerEntry(organizationId, ledgerData));
};

/**
 * Check if MongoDB supports transactions (requires replica set)
 * @returns {Promise<boolean>}
 */
const supportsTransactions = async () => {
  try {
    const admin = mongoose.connection.db.admin();
    const info = await admin.replSetGetStatus();
    return !!info;
  } catch (error) {
    return false;
  }
};

/**
 * Create a ledger entry and update inventory stock
 * Uses transaction if available (replica set), otherwise falls back to non-transactional
 * @param {Object} ledgerData - Ledger entry data
 * @param {ObjectId} ledgerData.organizationId
 * @param {ObjectId} ledgerData.inventoryId
 * @param {ObjectId} ledgerData.itemId
 * @param {string} ledgerData.type - IN, OUT, ADJUSTMENT
 * @param {number} ledgerData.quantity - Positive for IN, negative for OUT/ADJUSTMENT
 * @param {string} ledgerData.reason
 * @param {string} ledgerData.referenceType - ORDER, PURCHASE, REFUND, MANUAL
 * @param {ObjectId} ledgerData.referenceId
 * @param {ObjectId} ledgerData.createdBy
 * @returns {Promise<{ledger: InventoryLedger, inventory: Inventory}>}
 */
async function createLedgerEntry(organizationId, ledgerData) {
  const scopedLedgerData = normalizeLedgerEntry(organizationId, ledgerData);
  const useTransaction = await supportsTransactions();

  if (useTransaction) {
    return createLedgerEntryWithTransaction(scopedLedgerData);
  }
  return createLedgerEntryWithoutTransaction(scopedLedgerData);
}

/**
 * Create ledger entry WITH MongoDB transaction (replica set required)
 */
async function createLedgerEntryWithTransaction(ledgerData) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const inventory = await Inventory.findOne({
      _id: ledgerData.inventoryId,
      organizationId: ledgerData.organizationId,
    }).session(session);

    if (!inventory) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Inventory record not found');
    }

    const newStock = inventory.quantity + ledgerData.quantity;

    if (newStock < 0 && !inventory.allowNegativeStock) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Insufficient stock. Current: ${inventory.quantity}, Required: ${Math.abs(ledgerData.quantity)}`
      );
    }

    const ledgerEntry = await InventoryLedger.create(
      [
        {
          ...ledgerData,
          itemId: ledgerData.itemId || inventory.itemId,
          balanceAfter: newStock,
        },
      ],
      { session }
    );

    inventory.quantity = newStock;
    await inventory.save({ session });

    await session.commitTransaction();

    stockAlertService.checkInventoryStock(ledgerData.organizationId, inventory.id).catch((err) => {
      logger.error('Error checking stock alert:', err);
    });

    return {
      ledger: ledgerEntry[0],
      inventory,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Create ledger entry WITHOUT transaction (standalone MongoDB fallback)
 */
async function createLedgerEntryWithoutTransaction(ledgerData) {
  const inventory = await Inventory.findOne({
    _id: ledgerData.inventoryId,
    organizationId: ledgerData.organizationId,
  });

  if (!inventory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Inventory record not found');
  }

  const newStock = inventory.quantity + ledgerData.quantity;

  if (newStock < 0 && !inventory.allowNegativeStock) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Insufficient stock. Current: ${inventory.quantity}, Required: ${Math.abs(ledgerData.quantity)}`
    );
  }

  const ledgerEntry = await InventoryLedger.create({
    ...ledgerData,
    itemId: ledgerData.itemId || inventory.itemId,
    balanceAfter: newStock,
  });

  inventory.quantity = newStock;
  await inventory.save();

  stockAlertService.checkInventoryStock(ledgerData.organizationId, inventory.id).catch((err) => {
    logger.error('Error checking stock alert:', err);
  });

  return {
    ledger: ledgerEntry,
    inventory,
  };
}

/**
 * Create multiple ledger entries
 * Uses transaction if available (replica set), otherwise falls back to non-transactional
 * @param {Array} ledgerEntries - Array of ledger entry data
 * @returns {Promise<Array>}
 */
async function createBulkLedgerEntries(organizationId, ledgerEntries) {
  const scopedLedgerEntries = normalizeLedgerEntries(organizationId, ledgerEntries);
  const useTransaction = await supportsTransactions();

  if (useTransaction) {
    return createBulkLedgerEntriesWithTransaction(scopedLedgerEntries);
  }
  return createBulkLedgerEntriesWithoutTransaction(scopedLedgerEntries);
}

/**
 * Create bulk ledger entries WITH transaction (replica set required)
 */
async function createBulkLedgerEntriesWithTransaction(ledgerEntries) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const results = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const ledgerData of ledgerEntries) {
      const inventory = await Inventory.findOne({
        _id: ledgerData.inventoryId,
        organizationId: ledgerData.organizationId,
      }).session(session);

      if (!inventory) {
        throw new ApiError(httpStatus.NOT_FOUND, `Inventory record not found: ${ledgerData.inventoryId}`);
      }

      const newStock = inventory.quantity + ledgerData.quantity;

      if (newStock < 0 && !inventory.allowNegativeStock) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Insufficient stock. Current: ${inventory.quantity}, Required: ${Math.abs(ledgerData.quantity)}`
        );
      }

      const ledgerEntry = await InventoryLedger.create(
        [
          {
            ...ledgerData,
            itemId: ledgerData.itemId || inventory.itemId,
            balanceAfter: newStock,
          },
        ],
        { session }
      );

      inventory.quantity = newStock;
      await inventory.save({ session });

      results.push({
        ledger: ledgerEntry[0],
        inventory,
      });
    }

    await session.commitTransaction();

    results.forEach((result) => {
      stockAlertService.checkInventoryStock(ledgerEntries[0].organizationId, result.inventory.id).catch((err) => {
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
}

/**
 * Create bulk ledger entries WITHOUT transaction (standalone MongoDB fallback)
 */
async function createBulkLedgerEntriesWithoutTransaction(ledgerEntries) {
  const results = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const ledgerData of ledgerEntries) {
    const inventory = await Inventory.findOne({
      _id: ledgerData.inventoryId,
      organizationId: ledgerData.organizationId,
    });

    if (!inventory) {
      throw new ApiError(httpStatus.NOT_FOUND, `Inventory record not found: ${ledgerData.inventoryId}`);
    }

    const newStock = inventory.quantity + ledgerData.quantity;

    if (newStock < 0 && !inventory.allowNegativeStock) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Insufficient stock. Current: ${inventory.quantity}, Required: ${Math.abs(ledgerData.quantity)}`
      );
    }

    const ledgerEntry = await InventoryLedger.create({
      ...ledgerData,
      itemId: ledgerData.itemId || inventory.itemId,
      balanceAfter: newStock,
    });

    inventory.quantity = newStock;
    await inventory.save();

    results.push({
      ledger: ledgerEntry,
      inventory,
    });
  }

  results.forEach((result) => {
    stockAlertService.checkInventoryStock(ledgerEntries[0].organizationId, result.inventory.id).catch((err) => {
      logger.error('Error checking stock alert:', err);
    });
  });

  return results;
}

/**
 * Query ledger entries
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryLedgerEntries = async (organizationId, filter, options) => {
  validateOrganizationId(organizationId);
  const ledgerEntries = await InventoryLedger.paginate(buildOrganizationFilter(organizationId, filter), {
    ...options,
    populate: 'inventoryId itemId createdBy',
  });
  return ledgerEntries;
};

/**
 * Get ledger entries for a specific inventory record
 * @param {ObjectId} inventoryId
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getLedgerByInventory = async (organizationId, inventoryId, options = {}) => {
  validateOrganizationId(organizationId);
  return queryLedgerEntries(organizationId, { inventoryId }, { ...options, sortBy: 'createdAt:desc' });
};

/**
 * Get ledger entry by id
 * @param {ObjectId} id
 * @returns {Promise<InventoryLedger>}
 */
const getLedgerEntryById = async (organizationId, id) => {
  validateOrganizationId(organizationId);
  return safeFindOne(InventoryLedger, organizationId, { _id: id }).populate('inventoryId itemId createdBy');
};

/**
 * Get ledger statistics for an inventory record
 * @param {ObjectId} inventoryId
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<Object>}
 */
const getLedgerStats = async (organizationId, inventoryId, startDate, endDate) => {
  validateOrganizationId(organizationId);
  const match = {
    organizationId: new mongoose.Types.ObjectId(organizationId),
    inventoryId: new mongoose.Types.ObjectId(inventoryId),
  };

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
  getLedgerByInventory,
  getLedgerEntryById,
  getLedgerStats,
};
