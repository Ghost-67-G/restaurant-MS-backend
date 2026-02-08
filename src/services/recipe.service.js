const httpStatus = require('http-status');
const { Recipe, Ingredient } = require('../models');
const ApiError = require('../utils/ApiError');
const inventoryLedgerService = require('./inventoryLedger.service');

/**
 * Create a recipe
 * @param {Object} recipeBody
 * @returns {Promise<Recipe>}
 */
const createRecipe = async (recipeBody) => {
  // Verify ingredient exists
  const ingredient = await Ingredient.findById(recipeBody.ingredientId);
  if (!ingredient) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Ingredient not found');
  }
  return Recipe.create(recipeBody);
};

/**
 * Create multiple recipes for a menu item
 * @param {ObjectId} menuItemId
 * @param {Array} recipes - Array of {ingredientId, quantityUsed}
 * @returns {Promise<Recipe[]>}
 */
const createRecipesForMenuItem = async (menuItemId, recipes) => {
  const recipeDocs = recipes.map((recipe) => ({
    menuItemId,
    ingredientId: recipe.ingredientId,
    quantityUsed: recipe.quantityUsed,
  }));

  // Verify all ingredients exist
  const ingredientIds = recipes.map((r) => r.ingredientId);
  const ingredients = await Ingredient.find({ _id: { $in: ingredientIds } });

  if (ingredients.length !== ingredientIds.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'One or more ingredients not found');
  }

  return Recipe.insertMany(recipeDocs);
};

/**
 * Get recipes for a menu item
 * @param {ObjectId} menuItemId
 * @returns {Promise<Recipe[]>}
 */
const getRecipesByMenuItem = async (menuItemId) => {
  return Recipe.find({ menuItemId }).populate('ingredientId');
};

/**
 * Get recipes using an ingredient
 * @param {ObjectId} ingredientId
 * @returns {Promise<Recipe[]>}
 */
const getRecipesByIngredient = async (ingredientId) => {
  return Recipe.find({ ingredientId }).populate('menuItemId');
};

/**
 * Update recipe by id
 * @param {ObjectId} recipeId
 * @param {Object} updateBody
 * @returns {Promise<Recipe>}
 */
const updateRecipeById = async (recipeId, updateBody) => {
  const recipe = await Recipe.findById(recipeId);
  if (!recipe) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Recipe not found');
  }

  // If updating ingredientId, verify it exists
  if (updateBody.ingredientId) {
    const ingredient = await Ingredient.findById(updateBody.ingredientId);
    if (!ingredient) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Ingredient not found');
    }
  }

  Object.assign(recipe, updateBody);
  await recipe.save();
  return recipe;
};

/**
 * Delete recipe by id
 * @param {ObjectId} recipeId
 * @returns {Promise<Recipe>}
 */
const deleteRecipeById = async (recipeId) => {
  const recipe = await Recipe.findById(recipeId);
  if (!recipe) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Recipe not found');
  }
  await recipe.remove();
  return recipe;
};

/**
 * Delete all recipes for a menu item
 * @param {ObjectId} menuItemId
 * @returns {Promise<void>}
 */
const deleteRecipesByMenuItem = async (menuItemId) => {
  await Recipe.deleteMany({ menuItemId });
};

/**
 * Update recipes for a menu item (delete old, create new)
 * @param {ObjectId} menuItemId
 * @param {Array} recipes - Array of {ingredientId, quantityUsed}
 * @returns {Promise<Recipe[]>}
 */
const updateRecipesForMenuItem = async (menuItemId, recipes) => {
  await deleteRecipesByMenuItem(menuItemId);
  return createRecipesForMenuItem(menuItemId, recipes);
};

/**
 * Deduct ingredients for menu item (when order is placed)
 * @param {ObjectId} menuItemId
 * @param {number} quantity - Number of items ordered
 * @param {ObjectId} orderId - Order reference ID
 * @param {ObjectId} userId - User placing the order
 * @returns {Promise<void>}
 */
const deductIngredientsForMenuItem = async (menuItemId, quantity, orderId, userId) => {
  const recipes = await Recipe.find({ menuItemId }).populate('ingredientId');

  if (recipes.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No recipe found for this menu item');
  }

  // Prepare ledger entries for bulk operation
  const ledgerEntries = recipes.map((recipe) => {
    const requiredQuantity = recipe.quantityUsed * quantity;
    return {
      ingredientId: recipe.ingredientId._id,
      type: 'OUT',
      quantity: -requiredQuantity, // Negative for deduction
      reason: `Order deduction for ${recipe.ingredientId.name} (${quantity}x menu item)`,
      referenceType: 'ORDER',
      referenceId: orderId,
      createdBy: userId,
    };
  });

  // Use bulk ledger entry creation (includes stock validation and transaction)
  await inventoryLedgerService.createBulkLedgerEntries(ledgerEntries);
};

/**
 * Restore ingredients for menu item (when order is refunded)
 * @param {ObjectId} menuItemId
 * @param {number} quantity - Number of items to restore
 * @param {ObjectId} orderId - Order reference ID
 * @param {ObjectId} userId - User processing the refund
 * @param {string} reason - Refund reason
 * @returns {Promise<void>}
 */
const restoreIngredientsForMenuItem = async (menuItemId, quantity, orderId, userId, reason) => {
  const recipes = await Recipe.find({ menuItemId }).populate('ingredientId');

  if (recipes.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No recipe found for this menu item');
  }

  // Prepare ledger entries for bulk operation
  const ledgerEntries = recipes.map((recipe) => {
    const restoredQuantity = recipe.quantityUsed * quantity;
    return {
      ingredientId: recipe.ingredientId._id,
      type: 'IN',
      quantity: restoredQuantity, // Positive for restoration
      reason: reason || `Refund restoration for ${recipe.ingredientId.name} (${quantity}x menu item)`,
      referenceType: 'ORDER',
      referenceId: orderId,
      createdBy: userId,
    };
  });

  // Use bulk ledger entry creation (includes transaction)
  await inventoryLedgerService.createBulkLedgerEntries(ledgerEntries);
};

module.exports = {
  createRecipe,
  createRecipesForMenuItem,
  getRecipesByMenuItem,
  getRecipesByIngredient,
  updateRecipeById,
  deleteRecipeById,
  deleteRecipesByMenuItem,
  updateRecipesForMenuItem,
  deductIngredientsForMenuItem,
  restoreIngredientsForMenuItem,
};
