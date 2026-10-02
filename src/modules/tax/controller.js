const httpStatus = require('http-status');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const taxService = require('../../services/tax.service');

const createTax = catchAsync(async (req, res) => {
  const tax = await taxService.createTax(req.organizationId, req.body);
  res.status(httpStatus.CREATED).send(tax);
});

const getTaxes = catchAsync(async (req, res) => {
  const taxes = await taxService.getAllTaxes(req.organizationId);
  res.send(taxes);
});

const getActiveTax = catchAsync(async (req, res) => {
  const tax = await taxService.getActiveTax(req.organizationId);
  res.send(tax);
});

const getTax = catchAsync(async (req, res) => {
  const tax = await taxService.getTaxById(req.organizationId, req.params.taxId);
  if (!tax) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tax configuration not found');
  }
  res.send(tax);
});

const updateTax = catchAsync(async (req, res) => {
  const tax = await taxService.updateTaxById(req.organizationId, req.params.taxId, req.body);
  res.send(tax);
});

const deleteTax = catchAsync(async (req, res) => {
  await taxService.deleteTaxById(req.organizationId, req.params.taxId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createTax,
  getTaxes,
  getActiveTax,
  getTax,
  updateTax,
  deleteTax,
};
