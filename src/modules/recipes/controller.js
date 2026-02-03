const httpStatus = require('http-status');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const { recipeService } = require('../../services');

const createRecipe = catchAsync(async (req, res) => {
  const recipe = await recipeService.createRecipe(req.body);
  res.status(httpStatus.CREATED).send(recipe);
});

const getRecipesByMenuItem = catchAsync(async (req, res) => {
  const recipes = await recipeService.getRecipesByMenuItem(req.params.menuItemId);
  res.send(recipes);
});

const getRecipesByIngredient = catchAsync(async (req, res) => {
  const recipes = await recipeService.getRecipesByIngredient(req.params.ingredientId);
  res.send(recipes);
});

const updateRecipe = catchAsync(async (req, res) => {
  const recipe = await recipeService.updateRecipeById(req.params.recipeId, req.body);
  res.send(recipe);
});

const deleteRecipe = catchAsync(async (req, res) => {
  await recipeService.deleteRecipeById(req.params.recipeId);
  res.status(httpStatus.NO_CONTENT).send();
});

const updateMenuItemRecipes = catchAsync(async (req, res) => {
  const recipes = await recipeService.updateRecipesForMenuItem(req.params.menuItemId, req.body.recipes);
  res.send(recipes);
});

module.exports = {
  createRecipe,
  getRecipesByMenuItem,
  getRecipesByIngredient,
  updateRecipe,
  deleteRecipe,
  updateMenuItemRecipes,
};
