const Joi = require('joi');
const { objectId } = require('../../validations/custom.validation');
const { ORDER_STATUS, ORDER_TYPE, DISCOUNT_TYPE } = require('../../config/constants');

const createOrder = {
  body: Joi.object().keys({
    items: Joi.array()
      .min(1)
      .required()
      .items(
        Joi.object().keys({
          menuItemId: Joi.string().custom(objectId).required(),
          name: Joi.string().required(),
          price: Joi.number().min(0).required(),
          quantity: Joi.number().integer().min(1).required(),
          selectedModifiers: Joi.array().items(
            Joi.object().keys({
              name: Joi.string().trim().required(),
              price: Joi.number().min(0).required(),
            })
          ),
          itemNote: Joi.string().trim().allow('', null),
        })
      ),
    subtotal: Joi.number().min(0).required(),
    discountType: Joi.string().valid(...Object.values(DISCOUNT_TYPE)),
    discountValue: Joi.number().min(0),
    discountAmount: Joi.number().min(0).default(0),
    taxName: Joi.string().trim(),
    taxPercentage: Joi.number().min(0).max(100),
    taxAmount: Joi.number().min(0).default(0),
    deliveryFee: Joi.number().min(0).default(0),
    totalAmount: Joi.number().min(0).required(),
    orderType: Joi.string()
      .valid(...Object.values(ORDER_TYPE))
      .required(),
    tableNumber: Joi.string().trim(),
    notes: Joi.string().trim().allow('', null),
  }),
};

const getOrders = {
  query: Joi.object().keys({
    status: Joi.string().valid(...Object.values(ORDER_STATUS)),
    orderType: Joi.string().valid(...Object.values(ORDER_TYPE)),
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
