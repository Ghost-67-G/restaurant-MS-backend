const Joi = require('joi');
const { objectId } = require('../../validations/custom.validation');

const getLedgerEntries = {
  query: Joi.object().keys({
    ingredientId: Joi.string().custom(objectId),
    type: Joi.string().valid('IN', 'OUT', 'WASTE', 'ADJUSTMENT'),
    referenceType: Joi.string().valid('ORDER', 'PURCHASE', 'WASTE', 'MANUAL'),
    createdBy: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getLedgerEntry = {
  params: Joi.object().keys({
    ledgerId: Joi.string().custom(objectId),
  }),
};

const getLedgerByIngredient = {
  params: Joi.object().keys({
    ingredientId: Joi.string().custom(objectId),
  }),
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getLedgerStats = {
  params: Joi.object().keys({
    ingredientId: Joi.string().custom(objectId),
  }),
  query: Joi.object().keys({
    startDate: Joi.date(),
    endDate: Joi.date(),
  }),
};

module.exports = {
  getLedgerEntries,
  getLedgerEntry,
  getLedgerByIngredient,
  getLedgerStats,
};
