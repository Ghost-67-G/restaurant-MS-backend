const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const itemService = require('../../services/item.service');

const createItem = catchAsync(async (req, res) => {
  const item = await itemService.createItem(req.organizationId, req.body);
  res.status(httpStatus.CREATED).send(item);
});

const getItems = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'category', 'isActive', 'isSellable', 'trackStock']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  if (filter.name) {
    filter.name = { $regex: filter.name, $options: 'i' };
  }

  const result = await itemService.queryItems(req.organizationId, filter, options);
  res.send(result);
});

const getItem = catchAsync(async (req, res) => {
  const item = await itemService.getItemById(req.organizationId, req.params.itemId);
  if (!item) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Item not found');
  }
  res.send(item);
});

const updateItem = catchAsync(async (req, res) => {
  const item = await itemService.updateItemById(req.organizationId, req.params.itemId, req.body);
  res.send(item);
});

const deleteItem = catchAsync(async (req, res) => {
  await itemService.deleteItemById(req.organizationId, req.params.itemId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createItem,
  getItems,
  getItem,
  updateItem,
  deleteItem,
};
