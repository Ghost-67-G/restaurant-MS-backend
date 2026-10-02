const httpStatus = require('http-status');
const Tax = require('../models/tax.model');
const ApiError = require('../utils/ApiError');
const { validateOrganizationId, buildOrganizationFilter, safeFindOne } = require('../utils/organizationGuard');

/**
 * Create tax configuration
 * @param {Object} taxBody
 * @returns {Promise<Tax>}
 */
const createTax = async (organizationId, taxBody) => {
  validateOrganizationId(organizationId);
  if (taxBody.isActive) {
    await Tax.updateMany(buildOrganizationFilter(organizationId, { isActive: true }), { isActive: false });
  }
  return Tax.create({ organizationId, ...taxBody });
};

/**
 * Get all tax configurations
 * @returns {Promise<Tax[]>}
 */
const getAllTaxes = async (organizationId) => {
  validateOrganizationId(organizationId);
  return Tax.paginate({ organizationId }, { sortBy: 'createdAt:desc' });
};

/**
 * Get active tax configuration
 * @returns {Promise<Tax>}
 */
const getActiveTax = async (organizationId) => {
  validateOrganizationId(organizationId);
  return safeFindOne(Tax, organizationId, { isActive: true });
};

/**
 * Get tax by id
 * @param {ObjectId} id
 * @returns {Promise<Tax>}
 */
const getTaxById = async (organizationId, id) => {
  validateOrganizationId(organizationId);
  return safeFindOne(Tax, organizationId, { _id: id });
};

/**
 * Update tax by id
 * @param {ObjectId} taxId
 * @param {Object} updateBody
 * @returns {Promise<Tax>}
 */
const updateTaxById = async (organizationId, taxId, updateBody) => {
  validateOrganizationId(organizationId);
  const tax = await getTaxById(organizationId, taxId);
  if (!tax) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tax configuration not found');
  }

  if (updateBody.isActive) {
    await Tax.updateMany(buildOrganizationFilter(organizationId, { _id: { $ne: taxId }, isActive: true }), {
      isActive: false,
    });
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
const deleteTaxById = async (organizationId, taxId) => {
  validateOrganizationId(organizationId);
  const tax = await getTaxById(organizationId, taxId);
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
