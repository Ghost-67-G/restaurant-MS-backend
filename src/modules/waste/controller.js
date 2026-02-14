const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { wasteService } = require('../../services');
const pick = require('../../utils/pick');

const recordWaste = catchAsync(async (req, res) => {
  const wasteData = {
    ...req.body,
    createdBy: req.user.id,
  };
  const result = await wasteService.recordWaste(wasteData);
  res.status(httpStatus.CREATED).send(result);
});

const getAllWaste = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['ingredientId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await wasteService.getAllWaste(filter, options);
  res.send(result);
});

const getWasteByIngredient = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await wasteService.getWasteByIngredient(req.params.ingredientId, options);
  res.send(result);
});

const getWasteStats = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const stats = await wasteService.getWasteStats(startDate, endDate);
  res.send(stats);
});

module.exports = {
  recordWaste,
  getAllWaste,
  getWasteByIngredient,
  getWasteStats,
};
