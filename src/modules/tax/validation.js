const Joi = require('joi');
const { objectId } = require('../../validations/custom.validation');

const createTax = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    percentage: Joi.number().min(0).max(100).required(),
    isActive: Joi.boolean().default(true),
  }),
};

const getTaxes = {
  query: Joi.object().keys({}),
};

const getTax = {
  params: Joi.object().keys({
    taxId: Joi.string().custom(objectId),
  }),
};

const updateTax = {
  params: Joi.object().keys({
    taxId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      percentage: Joi.number().min(0).max(100),
      isActive: Joi.boolean(),
    })
    .min(1),
};

const deleteTax = {
  params: Joi.object().keys({
    taxId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createTax,
  getTaxes,
  getTax,
  updateTax,
  deleteTax,
};
