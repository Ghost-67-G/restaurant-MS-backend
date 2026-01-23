const httpStatus = require('http-status');
const MenuItem = require('../models/menuItem.model');
const ApiError = require('../utils/ApiError');

/**
 * Create a menu item
 * @param {Object} menuItemBody
 * @returns {Promise<MenuItem>}
 */
const createMenuItem = async (menuItemBody) => {
  return MenuItem.create(menuItemBody);
};

/**
 * Query for menu items
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryMenuItems = async (filter, options) => {
  const menuItems = await MenuItem.paginate(filter, options);
  return menuItems;
};

/**
 * Get menu item by id
 * @param {ObjectId} id
 * @returns {Promise<MenuItem>}
 */
const getMenuItemById = async (id) => {
  return MenuItem.findById(id);
};

/**
 * Update menu item by id
 * @param {ObjectId} menuItemId
 * @param {Object} updateBody
 * @returns {Promise<MenuItem>}
 */
const updateMenuItemById = async (menuItemId, updateBody) => {
  const menuItem = await getMenuItemById(menuItemId);
  if (!menuItem) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Menu item not found');
  }
  Object.assign(menuItem, updateBody);
  await menuItem.save();
  return menuItem;
};

/**
 * Delete menu item by id
 * @param {ObjectId} menuItemId
 * @returns {Promise<MenuItem>}
 */
const deleteMenuItemById = async (menuItemId) => {
  const menuItem = await getMenuItemById(menuItemId);
  if (!menuItem) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Menu item not found');
  }
  await menuItem.remove();
  return menuItem;
};

module.exports = {
  createMenuItem,
  queryMenuItems,
  getMenuItemById,
  updateMenuItemById,
  deleteMenuItemById,
};
