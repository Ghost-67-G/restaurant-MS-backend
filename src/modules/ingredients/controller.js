const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const { ingredientService } = require('../../services');

const createIngredient = catchAsync(async (req, res) => {
  const ingredient = await ingredientService.createIngredient(req.body);
  res.status(httpStatus.CREATED).send(ingredient);
});

const getIngredients = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'unit', 'isActive']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  if (filter.name) {
    filter.name = { $regex: filter.name, $options: 'i' };
  }

  const result = await ingredientService.queryIngredients(filter, options);
  res.send(result);
});

const getIngredient = catchAsync(async (req, res) => {
  const ingredient = await ingredientService.getIngredientById(req.params.ingredientId);
  if (!ingredient) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Ingredient not found');
  }
  res.send(ingredient);
});

const updateIngredient = catchAsync(async (req, res) => {
  const ingredient = await ingredientService.updateIngredientById(req.params.ingredientId, req.body);
  res.send(ingredient);
});

const deleteIngredient = catchAsync(async (req, res) => {
  await ingredientService.deleteIngredientById(req.params.ingredientId);
  res.status(httpStatus.NO_CONTENT).send();
});

const updateStock = catchAsync(async (req, res) => {
  const ingredient = await ingredientService.updateIngredientStock(
    req.params.ingredientId,
    req.body.quantity,
    req.body.reason,
    req.user.id,
    req.body.referenceType || 'MANUAL',
    req.body.referenceId || null
  );
  res.send(ingredient);
});

const getLowStock = catchAsync(async (req, res) => {
  const ingredients = await ingredientService.getLowStockIngredients();
  res.send(ingredients);
});

module.exports = {
  createIngredient,
  getIngredients,
  getIngredient,
  updateIngredient,
  deleteIngredient,
  updateStock,
  getLowStock,
};
