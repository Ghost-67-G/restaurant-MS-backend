const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const inventoryService = require('../../services/inventory.service');

const createInventory = catchAsync(async (req, res) => {
  const inventory = await inventoryService.createInventory(req.organizationId, req.body);
  res.status(httpStatus.CREATED).send(inventory);
});

const getInventoryItems = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  if (filter.name) {
    filter.name = { $regex: filter.name, $options: 'i' };
  }
  const result = await inventoryService.queryInventory(req.organizationId, filter, options);
  res.send(result);
});

const getInventory = catchAsync(async (req, res) => {
  const inventory = await inventoryService.getInventoryById(req.organizationId, req.params.inventoryId);
  if (!inventory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Inventory item not found');
  }
  res.send(inventory);
});

const updateInventory = catchAsync(async (req, res) => {
  const inventory = await inventoryService.updateInventoryById(
    req.organizationId,
    req.params.inventoryId,
    req.body,
    req.user.id
  );
  res.send(inventory);
});

const deleteInventory = catchAsync(async (req, res) => {
  await inventoryService.deleteInventoryById(req.organizationId, req.params.inventoryId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createInventory,
  getInventoryItems,
  getInventory,
  updateInventory,
  deleteInventory,
};
