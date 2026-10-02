const Joi = require('joi');
const { objectId } = require('../../validations/custom.validation');
const { ORDER_STATUS, DISCOUNT_TYPE, PAYMENT_METHOD } = require('../../config/constants');

const createOrder = {
  body: Joi.object().keys({
    items: Joi.array()
      .min(1)
      .required()
      .items(
        Joi.object().keys({
          itemId: Joi.string().custom(objectId).required(),
          name: Joi.string().required(),
          sku: Joi.string().trim().allow('', null),
          unitPrice: Joi.number().min(0).required(),
          quantity: Joi.number().integer().min(1).required(),
          selectedOptions: Joi.array().items(
            Joi.object().keys({
              name: Joi.string().trim().required(),
              priceAdjustment: Joi.number().required(),
            })
          ),
          discountAmount: Joi.number().min(0).default(0),
          lineTotal: Joi.number().min(0).required(),
          note: Joi.string().trim().allow('', null),
        })
      ),
    subtotal: Joi.number().min(0).required(),
    discountType: Joi.string().valid(...Object.values(DISCOUNT_TYPE)),
    discountValue: Joi.number().min(0),
    discountAmount: Joi.number().min(0).default(0),
    taxName: Joi.string().trim(),
    taxPercentage: Joi.number().min(0).max(100),
    taxAmount: Joi.number().min(0).default(0),
    totalAmount: Joi.number().min(0).required(),
    paymentMethod: Joi.string()
      .valid(...Object.values(PAYMENT_METHOD))
      .required(),
    notes: Joi.string().trim().allow('', null),
  }),
};

const getOrders = {
  query: Joi.object().keys({
    status: Joi.string().valid(...Object.values(ORDER_STATUS)),
    paymentMethod: Joi.string().valid(...Object.values(PAYMENT_METHOD)),
    createdBy: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getOrder = {
  params: Joi.object().keys({
    orderId: Joi.string().custom(objectId),
  }),
};

const updateOrder = {
  params: Joi.object().keys({
    orderId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      status: Joi.string().valid(...Object.values(ORDER_STATUS)),
    })
    .min(1),
};

const deleteOrder = {
  params: Joi.object().keys({
    orderId: Joi.string().custom(objectId),
  }),
};

const cancelOrder = {
  params: Joi.object().keys({
    orderId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  updateOrder,
  cancelOrder,
  deleteOrder,
};
