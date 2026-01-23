const Joi = require('joi');
const { objectId } = require('../../validations/custom.validation');

const createMenuItem = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    categoryId: Joi.string().custom(objectId),
    price: Joi.number().min(0).required(),
    costPrice: Joi.number().min(0).required(),
    isAvailable: Joi.boolean(),
    modifiers: Joi.array().items(
      Joi.object().keys({
        name: Joi.string().required(),
        price: Joi.number().default(0),
      })
    ),
  }),
};

const getMenuItems = {
  query: Joi.object().keys({
    name: Joi.string(),
    categoryId: Joi.string().custom(objectId),
    isAvailable: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getMenuItem = {
  params: Joi.object().keys({
    menuItemId: Joi.string().custom(objectId),
  }),
};

const updateMenuItem = {
  params: Joi.object().keys({
    menuItemId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      categoryId: Joi.string().custom(objectId),
      price: Joi.number().min(0),
      costPrice: Joi.number().min(0),
      isAvailable: Joi.boolean(),
      modifiers: Joi.array().items(
        Joi.object().keys({
          name: Joi.string().required(),
          price: Joi.number().default(0),
        })
      ),
    })
    .min(1),
};

const deleteMenuItem = {
  params: Joi.object().keys({
    menuItemId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createMenuItem,
  getMenuItems,
  getMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
