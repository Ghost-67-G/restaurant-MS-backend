const Joi = require('joi');
const { objectId } = require('../../validations/custom.validation');
const { WASTE_REASON } = require('../../config/constants');

const recordWaste = {
  body: Joi.object().keys({
    ingredientId: Joi.string().custom(objectId).required(),
    quantity: Joi.number().positive().required(),
    wasteReason: Joi.string()
      .valid(...Object.values(WASTE_REASON))
      .required(),
    notes: Joi.string().trim(),
  }),
};

const getAllWaste = {
  query: Joi.object().keys({
    ingredientId: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getWasteByIngredient = {
  params: Joi.object().keys({
    ingredientId: Joi.string().custom(objectId),
  }),
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getWasteStats = {
  query: Joi.object().keys({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }),
};

module.exports = {
  recordWaste,
  getAllWaste,
  getWasteByIngredient,
  getWasteStats,
};
