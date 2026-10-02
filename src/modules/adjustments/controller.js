const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const adjustmentService = require('../../services/orderAdjustment.service');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');

const createAdjustment = catchAsync(async (req, res) => {
  const adjustment = await adjustmentService.createAdjustment(req.organizationId, req.body, req.user);
  res.status(httpStatus.CREATED).send(adjustment);
});

const getAdjustments = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['orderId', 'type']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await adjustmentService.queryAdjustments(req.organizationId, filter, options);
  res.send(result);
});

const getAdjustment = catchAsync(async (req, res) => {
  const adjustment = await adjustmentService.getAdjustmentById(req.organizationId, req.params.adjustmentId);
  if (!adjustment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Adjustment not found');
  }
  res.send(adjustment);
});

const getOrderAdjustments = catchAsync(async (req, res) => {
  const adjustments = await adjustmentService.getOrderAdjustments(req.organizationId, req.params.orderId);
  res.send(adjustments);
});

module.exports = {
  createAdjustment,
  getAdjustments,
  getAdjustment,
  getOrderAdjustments,
};
