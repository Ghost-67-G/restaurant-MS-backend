const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const dashboardService = require('../../services/dashboard.service');

const getTodayStats = catchAsync(async (req, res) => {
  const stats = await dashboardService.getTodayStats(req.organizationId);
  res.status(httpStatus.OK).send(stats);
});

module.exports = {
  getTodayStats,
};
