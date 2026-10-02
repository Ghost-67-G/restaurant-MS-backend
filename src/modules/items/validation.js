const Joi = require('joi');
const { objectId } = require('../../validations/custom.validation');

const itemOptionSchema = Joi.object().keys({
  name: Joi.string().trim().required(),
  priceAdjustment: Joi.number().required(),
});

const createItem = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    sku: Joi.string().trim(),
    barcode: Joi.string().trim(),
    category: Joi.string().trim(),
    description: Joi.string().trim().allow('', null),
    unit: Joi.string().trim().default('pcs'),
    price: Joi.number().min(0).required(),
    costPrice: Joi.number().min(0).default(0),
    isSellable: Joi.boolean().default(true),
    trackStock: Joi.boolean().default(true),
    isActive: Joi.boolean().default(true),
    options: Joi.array().items(itemOptionSchema).default([]),
    initialStock: Joi.number().min(0).default(0),
    lowStockThreshold: Joi.number().min(0).default(10),
    allowNegativeStock: Joi.boolean().default(false),
  }),
};

const getItems = {
  query: Joi.object().keys({
    name: Joi.string(),
    category: Joi.string(),
    isActive: Joi.boolean(),
    isSellable: Joi.boolean(),
    trackStock: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getItem = {
  params: Joi.object().keys({
    itemId: Joi.string().custom(objectId),
  }),
};

const updateItem = {
  params: Joi.object().keys({
    itemId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      sku: Joi.string().trim(),
      barcode: Joi.string().trim(),
      category: Joi.string().trim(),
      description: Joi.string().trim().allow('', null),
      unit: Joi.string().trim(),
      price: Joi.number().min(0),
      costPrice: Joi.number().min(0),
      isSellable: Joi.boolean(),
      trackStock: Joi.boolean(),
      isActive: Joi.boolean(),
      options: Joi.array().items(itemOptionSchema),
      lowStockThreshold: Joi.number().min(0),
      allowNegativeStock: Joi.boolean(),
    })
    .min(1),
};

const deleteItem = {
  params: Joi.object().keys({
    itemId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createItem,
  getItems,
  getItem,
  updateItem,
  deleteItem,
};
