const httpStatus = require('http-status');
const Order = require('../models/order.model');
const { ORDER_STATUS } = require('../config/constants');
const { eventEmitter, EVENTS } = require('../utils/eventEmitter');
const ApiError = require('../utils/ApiError');

/**
 * Create an order
 * @param {Object} orderBody
 * @param {ObjectId} userId
 * @returns {Promise<Order>}
 */
const createOrder = async (orderBody, userId) => {
  const orderData = {
    ...orderBody,
    createdBy: userId,
  };
  const order = await Order.create(orderData);
  
  // Emit event for analytics/notifications
  eventEmitter.emitEvent(EVENTS.ORDER_CREATED, {
    orderId: order._id.toString(),
    userId,
    orderData,
  });
  
  return order;
};

/**
 * Query for orders
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryOrders = async (filter, options) => {
  const orders = await Order.paginate(filter, options);
  return orders;
};

/**
 * Get order by id
 * @param {ObjectId} id
 * @returns {Promise<Order>}
 */
const getOrderById = async (id) => {
  return Order.findById(id).populate('createdBy', 'name email');
};

/**
 * Update order by id
 * @param {ObjectId} orderId
 * @param {Object} updateBody
 * @param {ObjectId} userId - User updating the order
 * @returns {Promise<Order>}
 */
const updateOrderById = async (orderId, updateBody, userId) => {
  const order = await getOrderById(orderId);
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  // Prevent updating cancelled or completed orders
  if (order.status === ORDER_STATUS.CANCELLED) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update cancelled order');
  }
  if (order.status === ORDER_STATUS.COMPLETED && updateBody.status !== ORDER_STATUS.CANCELLED) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update completed order');
  }

  // Store previous status for event handlers
  const previousStatus = order.status;

  // Update order
  Object.assign(order, updateBody);
  await order.save();

  // Emit events based on status changes
  if (updateBody.status === ORDER_STATUS.COMPLETED && previousStatus !== ORDER_STATUS.COMPLETED) {
    // Emit ORDER_COMPLETED event - inventory deduction will be handled by event handler
    eventEmitter.emitEvent(EVENTS.ORDER_COMPLETED, {
      orderId: orderId.toString(),
      userId,
      previousStatus,
      order: order.toJSON(),
    });
  } else if (updateBody.status === ORDER_STATUS.CANCELLED && previousStatus !== ORDER_STATUS.CANCELLED) {
    // Emit ORDER_CANCELLED event - inventory restoration (if needed) handled by event handler
    eventEmitter.emitEvent(EVENTS.ORDER_CANCELLED, {
      orderId: orderId.toString(),
      userId,
      previousStatus,
      order: order.toJSON(),
    });
  } else {
    // Generic update event
    eventEmitter.emitEvent(EVENTS.ORDER_UPDATED, {
      orderId: orderId.toString(),
      userId,
      status: order.status,
      previousStatus,
    });
  }

  return order;
};

/**
 * Cancel order by id
 * @param {ObjectId} orderId
 * @returns {Promise<Order>}
 */
const cancelOrderById = async (orderId) => {
  const order = await getOrderById(orderId);
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  // Cannot cancel completed orders
  if (order.status === ORDER_STATUS.COMPLETED) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot cancel completed order');
  }

  // Already cancelled
  if (order.status === ORDER_STATUS.CANCELLED) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Order is already cancelled');
  }

  const previousStatus = order.status;
  order.status = ORDER_STATUS.CANCELLED;
  await order.save();

  // Emit ORDER_CANCELLED event
  eventEmitter.emitEvent(EVENTS.ORDER_CANCELLED, {
    orderId: orderId.toString(),
    previousStatus,
    order: order.toJSON(),
  });

  return order;
};

/**
 * Delete order by id
 * @param {ObjectId} orderId
 * @returns {Promise<Order>}
 */
const deleteOrderById = async (orderId) => {
  const order = await getOrderById(orderId);
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  // Prevent deleting completed orders - use refund/void instead
  if (order.status === ORDER_STATUS.COMPLETED) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Cannot delete completed orders. Use refund or void instead.'
    );
  }

  // Prevent deleting refunded orders
  if (order.isRefunded || order.refundedAmount > 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete orders with refunds');
  }

  await order.remove();
  return order;
};

module.exports = {
  createOrder,
  queryOrders,
  getOrderById,
  updateOrderById,
  cancelOrderById,
  deleteOrderById,
};
