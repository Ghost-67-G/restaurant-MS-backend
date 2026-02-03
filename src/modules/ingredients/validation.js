const Joi = require('joi');
const { objectId } = require('../../validations/custom.validation');

const createIngredient = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    unit: Joi.string().valid('kg', 'g', 'ltr', 'ml', 'pcs').required(),
    currentStock: Joi.number().min(0).default(0),
    lowStockThreshold: Joi.number().min(0).default(10),
    isActive: Joi.boolean().default(true),
  }),
};

const getIngredients = {
  query: Joi.object().keys({
    name: Joi.string(),
    unit: Joi.string().valid('kg', 'g', 'ltr', 'ml', 'pcs'),
    isActive: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getIngredient = {
  params: Joi.object().keys({
    ingredientId: Joi.string().custom(objectId),
  }),
};

const updateIngredient = {
  params: Joi.object().keys({
    ingredientId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      unit: Joi.string().valid('kg', 'g', 'ltr', 'ml', 'pcs'),
      currentStock: Joi.number().min(0),
      lowStockThreshold: Joi.number().min(0),
      isActive: Joi.boolean(),
    })
    .min(1),
};

const deleteIngredient = {
  params: Joi.object().keys({
    ingredientId: Joi.string().custom(objectId),
  }),
};

const updateStock = {
  params: Joi.object().keys({
    ingredientId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    quantity: Joi.number().required(),
    reason: Joi.string().required(),
    referenceType: Joi.string().valid('ORDER', 'PURCHASE', 'WASTE', 'MANUAL'),
    referenceId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createIngredient,
  getIngredients,
  getIngredient,
  updateIngredient,
  deleteIngredient,
  updateStock,
};
