const Joi = require('joi');
const { objectId } = require('../../validations/custom.validation');

const getAlerts = {
  query: Joi.object().keys({
    status: Joi.string().valid('PENDING', 'ACKNOWLEDGED'),
    ingredientId: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getActiveAlerts = {
  query: Joi.object().keys({
    ingredientId: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getAlert = {
  params: Joi.object().keys({
    alertId: Joi.string().custom(objectId),
  }),
};

const acknowledgeAlert = {
  params: Joi.object().keys({
    alertId: Joi.string().custom(objectId),
  }),
};

const acknowledgeMultipleAlerts = {
  body: Joi.object().keys({
    alertIds: Joi.array().items(Joi.string().custom(objectId)).min(1).required(),
  }),
};

module.exports = {
  getAlerts,
  getActiveAlerts,
  getAlert,
  acknowledgeAlert,
  acknowledgeMultipleAlerts,
};
