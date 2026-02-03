const httpStatus = require('http-status');
const { Ingredient } = require('../models');
const ApiError = require('../utils/ApiError');
const inventoryLedgerService = require('./inventoryLedger.service');

/**
 * Create an ingredient
 * @param {Object} ingredientBody
 * @returns {Promise<Ingredient>}
 */
const createIngredient = async (ingredientBody) => {
  return Ingredient.create(ingredientBody);
};

/**
 * Query for ingredients
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryIngredients = async (filter, options) => {
  const ingredients = await Ingredient.paginate(filter, options);
  return ingredients;
};

/**
 * Get ingredient by id
 * @param {ObjectId} id
 * @returns {Promise<Ingredient>}
 */
const getIngredientById = async (id) => {
  return Ingredient.findById(id);
};

/**
 * Update ingredient by id
 * @param {ObjectId} ingredientId
 * @param {Object} updateBody
 * @returns {Promise<Ingredient>}
 */
const updateIngredientById = async (ingredientId, updateBody) => {
  const ingredient = await getIngredientById(ingredientId);
  if (!ingredient) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Ingredient not found');
  }
  Object.assign(ingredient, updateBody);
  await ingredient.save();
  return ingredient;
};

/**
 * Delete ingredient by id
 * @param {ObjectId} ingredientId
 * @returns {Promise<Ingredient>}
 */
const deleteIngredientById = async (ingredientId) => {
  const ingredient = await getIngredientById(ingredientId);
  if (!ingredient) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Ingredient not found');
  }
  await ingredient.remove();
  return ingredient;
};

/**
 * Update ingredient stock using ledger entry
 * @param {ObjectId} ingredientId
 * @param {number} quantity - Positive to add, negative to subtract
 * @param {string} reason - Reason for stock update
 * @param {ObjectId} userId - User making the update
 * @param {string} referenceType - ORDER, PURCHASE, WASTE, MANUAL
 * @param {ObjectId} referenceId - Optional reference ID
 * @returns {Promise<Ingredient>}
 */
const updateIngredientStock = async (
  ingredientId,
  quantity,
  reason,
  userId,
  referenceType = 'MANUAL',
  referenceId = null
) => {
  const ingredient = await getIngredientById(ingredientId);
  if (!ingredient) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Ingredient not found');
  }

  // Determine ledger type based on quantity
  let type;
  if (quantity > 0) {
    type = 'IN';
  } else if (referenceType === 'WASTE') {
    type = 'WASTE';
  } else if (referenceType === 'MANUAL') {
    type = 'ADJUSTMENT';
  } else {
    type = 'OUT';
  }

  // Create ledger entry (this will also update the stock in a transaction)
  const result = await inventoryLedgerService.createLedgerEntry({
    ingredientId,
    type,
    quantity,
    reason,
    referenceType,
    referenceId,
    createdBy: userId,
  });

  return result.ingredient;
};

/**
 * Get low stock ingredients
 * @returns {Promise<Ingredient[]>}
 */
const getLowStockIngredients = async () => {
  const ingredients = await Ingredient.find({ isActive: true });
  return ingredients.filter((ingredient) => ingredient.currentStock <= ingredient.lowStockThreshold);
};

module.exports = {
  createIngredient,
  queryIngredients,
  getIngredientById,
  updateIngredientById,
  deleteIngredientById,
  updateIngredientStock,
  getLowStockIngredients,
};
