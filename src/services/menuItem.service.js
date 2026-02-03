const httpStatus = require('http-status');
const MenuItem = require('../models/menuItem.model');
const ApiError = require('../utils/ApiError');
const recipeService = require('./recipe.service');

/**
 * Create a menu item
 * @param {Object} menuItemBody
 * @param {Array} recipes - Array of {ingredientId, quantityUsed}
 * @returns {Promise<MenuItem>}
 */
const createMenuItem = async (menuItemBody, recipes = []) => {
  const menuItem = await MenuItem.create(menuItemBody);
  
  // Create recipes if provided
  if (recipes && recipes.length > 0) {
    await recipeService.createRecipesForMenuItem(menuItem.id, recipes);
  }
  
  return menuItem;
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
 * @param {boolean} includeRecipes - Whether to populate recipes
 * @returns {Promise<MenuItem>}
 */
const getMenuItemById = async (id, includeRecipes = false) => {
  const query = MenuItem.findById(id);
  
  if (includeRecipes) {
    query.populate({
      path: 'recipes',
      populate: {
        path: 'ingredientId',
        select: 'name unit currentStock',
      },
    });
  }
  
  return query;
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
  
  // Delete associated recipes
  await recipeService.deleteRecipesByMenuItem(menuItemId);
  
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
