const httpStatus = require('http-status');
const Order = require('../models/order.model');
const { ORDER_STATUS } = require('../config/constants');
const { eventEmitter, EVENTS } = require('../utils/eventEmitter');
const ApiError = require('../utils/ApiError');
const { validateOrganizationId, buildOrganizationFilter, safeFindOne } = require('../utils/organizationGuard');

/**
 * Create an order
 * @param {Object} orderBody
 * @param {Object} user
 * @returns {Promise<Order>}
 */
const createOrder = async (organizationId, orderBody, user) => {
  const normalizedOrganizationId = validateOrganizationId(organizationId);
  const orderData = {
    ...orderBody,
    organizationId: normalizedOrganizationId,
    createdBy: user.id,
  };
  const order = await Order.create(orderData);

  // Emit event for analytics/notifications
  eventEmitter.emitEvent(EVENTS.ORDER_CREATED, {
    organizationId: normalizedOrganizationId,
    orderId: order._id.toString(),
    userId: user.id,
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
const queryOrders = async (organizationId, filter, options) => {
  validateOrganizationId(organizationId);
  const orders = await Order.paginate(buildOrganizationFilter(organizationId, filter), options);
  return orders;
};

/**
 * Get order by id
 * @param {ObjectId} id
 * @returns {Promise<Order>}
 */
const getOrderById = async (organizationId, id) => {
  validateOrganizationId(organizationId);
  return safeFindOne(Order, organizationId, { _id: id }).populate('createdBy', 'name email');
};

/**
 * Update order by id
 * @param {ObjectId} orderId
 * @param {Object} updateBody
 * @param {Object} user - User updating the order
 * @returns {Promise<Order>}
 */
const updateOrderById = async (organizationId, orderId, updateBody, user) => {
  const normalizedOrganizationId = validateOrganizationId(organizationId);
  const order = await getOrderById(normalizedOrganizationId, orderId);
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  // Prevent updating cancelled or completed orders
  if ([ORDER_STATUS.CANCELLED, ORDER_STATUS.VOIDED].includes(order.status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update cancelled or voided order');
  }
  if (
    [ORDER_STATUS.COMPLETED, ORDER_STATUS.REFUNDED].includes(order.status) &&
    updateBody.status !== ORDER_STATUS.CANCELLED
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update completed or refunded order');
  }

  // Store previous status for event handlers
  const previousStatus = order.status;

  // Update order
  Object.assign(order, updateBody);
  await order.save();

  // Emit events based on status changes
  if (updateBody.status === ORDER_STATUS.COMPLETED && previousStatus !== ORDER_STATUS.COMPLETED) {
    // Emit ORDER_COMPLETED event - invoice generation handled by event handler
    eventEmitter.emitEvent(EVENTS.ORDER_COMPLETED, {
      organizationId: normalizedOrganizationId,
      orderId: orderId.toString(),
      userId: user.id,
      previousStatus,
      order: order.toJSON(),
    });
  } else if (updateBody.status === ORDER_STATUS.CANCELLED && previousStatus !== ORDER_STATUS.CANCELLED) {
    eventEmitter.emitEvent(EVENTS.ORDER_CANCELLED, {
      organizationId: normalizedOrganizationId,
      orderId: orderId.toString(),
      userId: user.id,
      previousStatus,
      order: order.toJSON(),
    });
  } else {
    eventEmitter.emitEvent(EVENTS.ORDER_UPDATED, {
      organizationId: normalizedOrganizationId,
      orderId: orderId.toString(),
      userId: user.id,
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
const cancelOrderById = async (organizationId, orderId, user) => {
  const normalizedOrganizationId = validateOrganizationId(organizationId);
  const order = await getOrderById(normalizedOrganizationId, orderId);
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
    organizationId: normalizedOrganizationId,
    orderId: orderId.toString(),
    userId: user.id,
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
const deleteOrderById = async (orderId, organizationId) => {
  validateOrganizationId(organizationId);
  const order = await getOrderById(organizationId, orderId);
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  if ([ORDER_STATUS.COMPLETED, ORDER_STATUS.REFUNDED].includes(order.status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete completed orders. Use refund or void instead.');
  }

  if (order.isRefunded || order.refundedAmount > 0 || order.isVoided) {
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
