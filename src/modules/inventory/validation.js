const Joi = require('joi');
const { objectId } = require('../../validations/custom.validation');

const createInventory = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    quantity: Joi.number().min(0).required(),
  }),
};

const getInventoryItems = {
  query: Joi.object().keys({
    name: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getInventory = {
  params: Joi.object().keys({
    inventoryId: Joi.string().custom(objectId),
  }),
};

const updateInventory = {
  params: Joi.object().keys({
    inventoryId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      quantity: Joi.number().min(0),
    })
    .min(1),
};

const deleteInventory = {
  params: Joi.object().keys({
    inventoryId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createInventory,
  getInventoryItems,
  getInventory,
  updateInventory,
  deleteInventory,
};
