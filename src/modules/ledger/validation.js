const Joi = require('joi');
const { objectId } = require('../../validations/custom.validation');

const getLedgerEntries = {
  query: Joi.object().keys({
    inventoryId: Joi.string().custom(objectId),
    itemId: Joi.string().custom(objectId),
    type: Joi.string().valid('IN', 'OUT', 'ADJUSTMENT'),
    referenceType: Joi.string().valid('ORDER', 'PURCHASE', 'REFUND', 'MANUAL'),
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

const getLedgerByInventory = {
  params: Joi.object().keys({
    inventoryId: Joi.string().custom(objectId),
  }),
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getLedgerStats = {
  params: Joi.object().keys({
    inventoryId: Joi.string().custom(objectId),
  }),
  query: Joi.object().keys({
    startDate: Joi.date(),
    endDate: Joi.date(),
  }),
};

module.exports = {
  getLedgerEntries,
  getLedgerEntry,
  getLedgerByInventory,
  getLedgerStats,
};
