const Joi = require('joi');

const getTodayStats = {
  query: Joi.object().keys({}),
};

module.exports = {
  getTodayStats,
};
