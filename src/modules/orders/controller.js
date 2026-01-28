const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const orderService = require('../../services/order.service');

const createOrder = catchAsync(async (req, res) => {
  const order = await orderService.createOrder(req.body, req.user.id);
  res.status(httpStatus.CREATED).send(order);
});

const getOrders = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['status', 'createdBy']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  // Cashiers can only see their own orders unless explicitly querying all
  if (req.user.role === 'cashier' && !req.query.createdBy) {
    filter.createdBy = req.user.id;
  }

  const result = await orderService.queryOrders(filter, options);
  res.send(result);
});

const getOrder = catchAsync(async (req, res) => {
  const order = await orderService.getOrderById(req.params.orderId);
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }
  res.send(order);
});

const updateOrder = catchAsync(async (req, res) => {
  const order = await orderService.updateOrderById(req.params.orderId, req.body);
  res.send(order);
});

const deleteOrder = catchAsync(async (req, res) => {
  await orderService.deleteOrderById(req.params.orderId);
  res.status(httpStatus.NO_CONTENT).send();
});

const cancelOrder = catchAsync(async (req, res) => {
  const order = await orderService.cancelOrderById(req.params.orderId);
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
