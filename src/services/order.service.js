const httpStatus = require('http-status');
const Order = require('../models/order.model');
const MenuItem = require('../models/menuItem.model');
const { ORDER_STATUS } = require('../config/constants');
const inventoryService = require('./inventory.service');
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
  return Order.create(orderData);
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
 * @returns {Promise<Order>}
 */
const updateOrderById = async (orderId, updateBody) => {
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

  // If order is being marked as completed, reduce inventory
  if (updateBody.status === ORDER_STATUS.COMPLETED && order.status !== ORDER_STATUS.COMPLETED) {
    // Process each item in the order
    for (const item of order.items) {
      // Get the menu item to find its linked inventory
      const menuItem = await MenuItem.findById(item.menuItemId);
      
      // If menu item has linked inventory, reduce it
      if (menuItem && menuItem.inventoryItemId) {
        await inventoryService.reduceInventory(menuItem.inventoryItemId, item.quantity);
      }
    }
  }

  Object.assign(order, updateBody);
  await order.save();
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

  order.status = ORDER_STATUS.CANCELLED;
  await order.save();
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
