const Joi = require('joi');
const { objectId } = require('../../validations/custom.validation');

const createInvoice = {
  body: Joi.object().keys({
    orderId: Joi.string().custom(objectId).required(),
  }),
};

const getInvoices = {
  query: Joi.object().keys({
    orderId: Joi.string().custom(objectId),
    invoiceNumber: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getInvoice = {
  params: Joi.object().keys({
    invoiceId: Joi.string().custom(objectId),
  }),
};

const getInvoiceByNumber = {
  params: Joi.object().keys({
    invoiceNumber: Joi.string().required(),
  }),
};

module.exports = {
  createInvoice,
  getInvoices,
  getInvoice,
  getInvoiceByNumber,
};
