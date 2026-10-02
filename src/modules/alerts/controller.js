const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { stockAlertService } = require('../../services');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');

const checkAndCreateAlerts = catchAsync(async (req, res) => {
  const alerts = await stockAlertService.checkAndCreateAlerts(req.organizationId);
  res.status(httpStatus.OK).send(alerts);
});

const getAlerts = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['status', 'inventoryId', 'itemId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await stockAlertService.getAlerts(req.organizationId, filter, options);
  res.send(result);
});

const getActiveAlerts = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['inventoryId', 'itemId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await stockAlertService.getActiveAlerts(req.organizationId, filter, options);
  res.send(result);
});

const getAlert = catchAsync(async (req, res) => {
  const alert = await stockAlertService.getAlertById(req.organizationId, req.params.alertId);
  if (!alert) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Alert not found');
  }
  res.send(alert);
});

const acknowledgeAlert = catchAsync(async (req, res) => {
  const alert = await stockAlertService.acknowledgeAlert(req.organizationId, req.params.alertId, req.user.id);
  res.send(alert);
});

const acknowledgeMultipleAlerts = catchAsync(async (req, res) => {
  const count = await stockAlertService.acknowledgeMultipleAlerts(req.organizationId, req.body.alertIds, req.user.id);
  res.send({ acknowledgedCount: count });
});

const getPendingCount = catchAsync(async (req, res) => {
  const count = await stockAlertService.getPendingAlertsCount(req.organizationId);
  res.send({ count });
});

module.exports = {
  checkAndCreateAlerts,
  getAlerts,
  getActiveAlerts,
  getAlert,
  acknowledgeAlert,
  acknowledgeMultipleAlerts,
  getPendingCount,
};
