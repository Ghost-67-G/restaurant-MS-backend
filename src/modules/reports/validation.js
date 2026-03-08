const Joi = require('joi');
const { ORDER_TYPE } = require('../../config/constants');

const getSummary = {
  query: Joi.object().keys({
    from: Joi.date().iso(),
    to: Joi.date().iso(),
    orderType: Joi.string().valid(...Object.values(ORDER_TYPE)),
    includeCancelled: Joi.boolean().default(false),
    includeRefunded: Joi.boolean().default(true),
    topLimit: Joi.number().integer().min(1).max(50).default(10),
  }),
};

module.exports = {
  getSummary,
};
