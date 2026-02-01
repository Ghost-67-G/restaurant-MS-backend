const httpStatus = require('http-status');
const Tax = require('../models/tax.model');
const ApiError = require('../utils/ApiError');

/**
 * Create tax configuration
 * @param {Object} taxBody
 * @returns {Promise<Tax>}
 */
const createTax = async (taxBody) => {
  // Deactivate any existing active tax
  if (taxBody.isActive) {
    await Tax.updateMany({ isActive: true }, { isActive: false });
  }
  return Tax.create(taxBody);
};

/**
 * Get all tax configurations
 * @returns {Promise<Tax[]>}
 */
const getAllTaxes = async () => {
  return Tax.paginate({}, { sortBy: 'createdAt:desc' });
};

/**
 * Get active tax configuration
 * @returns {Promise<Tax>}
 */
const getActiveTax = async () => {
  return Tax.findOne({ isActive: true });
};

/**
 * Get tax by id
 * @param {ObjectId} id
 * @returns {Promise<Tax>}
 */
const getTaxById = async (id) => {
  return Tax.findById(id);
};

/**
 * Update tax by id
 * @param {ObjectId} taxId
 * @param {Object} updateBody
 * @returns {Promise<Tax>}
 */
const updateTaxById = async (taxId, updateBody) => {
  const tax = await getTaxById(taxId);
  if (!tax) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tax configuration not found');
  }
  
  // If setting this as active, deactivate others
  if (updateBody.isActive) {
    await Tax.updateMany({ _id: { $ne: taxId }, isActive: true }, { isActive: false });
  }
  
  Object.assign(tax, updateBody);
  await tax.save();
  return tax;
};

/**
 * Delete tax by id
 * @param {ObjectId} taxId
 * @returns {Promise<Tax>}
 */
const deleteTaxById = async (taxId) => {
  const tax = await getTaxById(taxId);
  if (!tax) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tax configuration not found');
  }
  await tax.remove();
  return tax;
};

module.exports = {
  createTax,
  getAllTaxes,
  getActiveTax,
  getTaxById,
  updateTaxById,
  deleteTaxById,
};
