const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const orderService = require('../../services/order.service');

const createOrder = catchAsync(async (req, res) => {
  const order = await orderService.createOrder(req.organizationId, req.body, req.user);
  res.status(httpStatus.CREATED).send(order);
});

const getOrders = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['status', 'paymentMethod', 'createdBy']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  if (req.user.role === 'staff' && !req.query.createdBy) {
    filter.createdBy = req.user.id;
  }

  const result = await orderService.queryOrders(req.organizationId, filter, options);
  res.send(result);
});

const getOrder = catchAsync(async (req, res) => {
  const order = await orderService.getOrderById(req.organizationId, req.params.orderId);
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }
  res.send(order);
});

const updateOrder = catchAsync(async (req, res) => {
  if (req.user.role === 'staff' && !['completed', 'cancelled'].includes(req.body.status)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Staff can only complete or cancel orders');
  }

  const order = await orderService.updateOrderById(req.organizationId, req.params.orderId, req.body, req.user);
  res.send(order);
});

const deleteOrder = catchAsync(async (req, res) => {
  await orderService.deleteOrderById(req.params.orderId, req.organizationId);
  res.status(httpStatus.NO_CONTENT).send();
});

const cancelOrder = catchAsync(async (req, res) => {
  const order = await orderService.cancelOrderById(req.organizationId, req.params.orderId, req.user);
  res.send(order);
});

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  updateOrder,
  cancelOrder,
  deleteOrder,
};
