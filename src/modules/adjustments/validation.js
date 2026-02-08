const Joi = require('joi');
const { objectId } = require('../../validations/custom.validation');
const { ADJUSTMENT_TYPE } = require('../../config/constants');

const createAdjustment = {
  body: Joi.object().keys({
    orderId: Joi.string().custom(objectId).required(),
    type: Joi.string()
      .valid(...Object.values(ADJUSTMENT_TYPE))
      .required(),
    amount: Joi.number().min(0).required(),
    reason: Joi.string().required().trim(),
  }),
};

const getAdjustments = {
  query: Joi.object().keys({
    orderId: Joi.string().custom(objectId),
    type: Joi.string().valid(...Object.values(ADJUSTMENT_TYPE)),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getAdjustment = {
  params: Joi.object().keys({
    adjustmentId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createAdjustment,
  getAdjustments,
  getAdjustment,
};
