const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const reportsService = require('../../services/reports.service');

const getSummary = catchAsync(async (req, res) => {
  const summary = await reportsService.getSummary(req.query);
  res.status(httpStatus.OK).send(summary);
});

module.exports = {
  getSummary,
};
