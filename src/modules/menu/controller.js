const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const menuItemService = require('../../services/menuItem.service');

const createMenuItem = catchAsync(async (req, res) => {
  const menuItem = await menuItemService.createMenuItem(req.body);
  res.status(httpStatus.CREATED).send(menuItem);
});

const getMenuItems = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'categoryId', 'isAvailable']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await menuItemService.queryMenuItems(filter, options);
  res.send(result);
});

const getMenuItem = catchAsync(async (req, res) => {
  const menuItem = await menuItemService.getMenuItemById(req.params.menuItemId);
  if (!menuItem) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Menu item not found');
  }
  res.send(menuItem);
});

const updateMenuItem = catchAsync(async (req, res) => {
  const menuItem = await menuItemService.updateMenuItemById(req.params.menuItemId, req.body);
  res.send(menuItem);
});

const deleteMenuItem = catchAsync(async (req, res) => {
  await menuItemService.deleteMenuItemById(req.params.menuItemId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createMenuItem,
  getMenuItems,
  getMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
