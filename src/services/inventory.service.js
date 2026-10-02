const httpStatus = require('http-status');
const { Inventory, Item } = require('../models');
const ApiError = require('../utils/ApiError');
const inventoryLedgerService = require('./inventoryLedger.service');
const { validateOrganizationId, buildOrganizationFilter, safeFindOne, safeQuery } = require('../utils/organizationGuard');

/**
 * Create an inventory item
 * @param {Object} inventoryBody
 * @returns {Promise<Inventory>}
 */
const createInventory = async (organizationId, inventoryBody) => {
  validateOrganizationId(organizationId);
  const item = await safeFindOne(Item, organizationId, { _id: inventoryBody.itemId });
  if (!item) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Item not found');
  }

  return Inventory.create({
    organizationId,
    itemId: item.id,
    quantity: inventoryBody.quantity || 0,
    lowStockThreshold: inventoryBody.lowStockThreshold || 10,
    allowNegativeStock: Boolean(inventoryBody.allowNegativeStock),
  });
};

/**
 * Query for inventory items
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryInventory = async (organizationId, filter, options) => {
  validateOrganizationId(organizationId);
  const queryFilter = buildOrganizationFilter(organizationId, filter);

  if (filter.name) {
    const items = await safeQuery(Item, organizationId, { name: filter.name }).select('_id');
    queryFilter.itemId = { $in: items.map((item) => item._id) };
    delete queryFilter.name;
  }

  const inventory = await Inventory.paginate(queryFilter, {
    ...options,
    populate: 'itemId',
  });
  return inventory;
};

/**
 * Get inventory item by id
 * @param {ObjectId} id
 * @returns {Promise<Inventory>}
 */
const getInventoryById = async (organizationId, id) => {
  validateOrganizationId(organizationId);
  return safeFindOne(Inventory, organizationId, { _id: id }).populate('itemId');
};

/**
 * Update inventory item by id
 * @param {ObjectId} inventoryId
 * @param {Object} updateBody
 * @returns {Promise<Inventory>}
 */
const updateInventoryById = async (organizationId, inventoryId, updateBody, userId) => {
  validateOrganizationId(organizationId);
  const inventory = await getInventoryById(organizationId, inventoryId);
  if (!inventory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Inventory item not found');
  }

  if (updateBody.quantity !== undefined && updateBody.quantity !== inventory.quantity) {
    const quantityDelta = updateBody.quantity - inventory.quantity;
    await inventoryLedgerService.createLedgerEntry(organizationId, {
      organizationId,
      inventoryId: inventory.id,
      itemId: inventory.itemId.id,
      type: quantityDelta > 0 ? 'IN' : 'ADJUSTMENT',
      quantity: quantityDelta,
      reason: updateBody.reason || 'Manual stock update',
      referenceType: 'MANUAL',
      createdBy: userId,
    });
  }

  if (updateBody.lowStockThreshold !== undefined) {
    inventory.lowStockThreshold = updateBody.lowStockThreshold;
  }
  if (updateBody.allowNegativeStock !== undefined) {
    inventory.allowNegativeStock = updateBody.allowNegativeStock;
  }

  await inventory.save();
  return inventory;
};

/**
 * Delete inventory item by id
 * @param {ObjectId} inventoryId
 * @returns {Promise<Inventory>}
 */
const deleteInventoryById = async (organizationId, inventoryId) => {
  validateOrganizationId(organizationId);
  const inventory = await getInventoryById(organizationId, inventoryId);
  if (!inventory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Inventory item not found');
  }
  await inventory.remove();
  return inventory;
};

/**
 * Reduce inventory quantity
 * @param {ObjectId} inventoryId
 * @param {Number} quantity
 * @returns {Promise<Inventory>}
 */
const reduceInventory = async (
  organizationId,
  inventoryId,
  quantity,
  userId,
  referenceType = 'ORDER',
  referenceId = null
) => {
  validateOrganizationId(organizationId);
  const inventory = await getInventoryById(organizationId, inventoryId);
  if (!inventory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Inventory item not found');
  }

  await inventoryLedgerService.createLedgerEntry(organizationId, {
    organizationId,
    inventoryId: inventory.id,
    itemId: inventory.itemId.id,
    type: 'OUT',
    quantity: -Math.abs(quantity),
    reason: 'Order inventory deduction',
    referenceType,
    referenceId,
    createdBy: userId,
  });

  return getInventoryById(organizationId, inventoryId);
};

/**
 * Increase inventory quantity (for refunds/restocks)
 * @param {ObjectId} inventoryId
 * @param {Number} quantity
 * @returns {Promise<Inventory>}
 */
const increaseInventory = async (
  organizationId,
  inventoryId,
  quantity,
  userId,
  referenceType = 'REFUND',
  referenceId = null
) => {
  validateOrganizationId(organizationId);
  const inventory = await getInventoryById(organizationId, inventoryId);
  if (!inventory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Inventory item not found');
  }

  await inventoryLedgerService.createLedgerEntry(organizationId, {
    organizationId,
    inventoryId: inventory.id,
    itemId: inventory.itemId.id,
    type: 'IN',
    quantity: Math.abs(quantity),
    reason: 'Refund stock restoration',
    referenceType,
    referenceId,
    createdBy: userId,
  });

  return getInventoryById(organizationId, inventoryId);
};

module.exports = {
  createInventory,
  queryInventory,
  getInventoryById,
  updateInventoryById,
  deleteInventoryById,
  reduceInventory,
  increaseInventory,
};
