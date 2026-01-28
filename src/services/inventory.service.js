const httpStatus = require('http-status');
const Inventory = require('../models/inventory.model');
const ApiError = require('../utils/ApiError');

/**
 * Create an inventory item
 * @param {Object} inventoryBody
 * @returns {Promise<Inventory>}
 */
const createInventory = async (inventoryBody) => {
  return Inventory.create(inventoryBody);
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
const queryInventory = async (filter, options) => {
  const inventory = await Inventory.paginate(filter, options);
  return inventory;
};

/**
 * Get inventory item by id
 * @param {ObjectId} id
 * @returns {Promise<Inventory>}
 */
const getInventoryById = async (id) => {
  return Inventory.findById(id);
};

/**
 * Update inventory item by id
 * @param {ObjectId} inventoryId
 * @param {Object} updateBody
 * @returns {Promise<Inventory>}
 */
const updateInventoryById = async (inventoryId, updateBody) => {
  const inventory = await getInventoryById(inventoryId);
  if (!inventory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Inventory item not found');
  }
  Object.assign(inventory, updateBody);
  await inventory.save();
  return inventory;
};

/**
 * Delete inventory item by id
 * @param {ObjectId} inventoryId
 * @returns {Promise<Inventory>}
 */
const deleteInventoryById = async (inventoryId) => {
  const inventory = await getInventoryById(inventoryId);
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
const reduceInventory = async (inventoryId, quantity) => {
  const inventory = await getInventoryById(inventoryId);
  if (!inventory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Inventory item not found');
  }

  inventory.quantity = Math.max(0, inventory.quantity - quantity);
  await inventory.save();
  return inventory;
};

module.exports = {
  createInventory,
  queryInventory,
  getInventoryById,
  updateInventoryById,
  deleteInventoryById,
  reduceInventory,
};
