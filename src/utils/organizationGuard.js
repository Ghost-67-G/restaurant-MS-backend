const mongoose = require('mongoose');
const httpStatus = require('http-status');
const ApiError = require('./ApiError');

const normalizeOrganizationId = (organizationId) => {
  if (!organizationId) {
    return organizationId;
  }

  if (typeof organizationId === 'string') {
    return organizationId;
  }

  if (organizationId instanceof mongoose.Types.ObjectId) {
    return organizationId.toString();
  }

  if (typeof organizationId.toString === 'function') {
    return organizationId.toString();
  }

  return organizationId;
};

const validateOrganizationId = (
  organizationId,
  {
    source = 'organizationId',
    missingStatusCode = httpStatus.INTERNAL_SERVER_ERROR,
    invalidStatusCode = httpStatus.BAD_REQUEST,
  } = {}
) => {
  const normalizedOrganizationId = normalizeOrganizationId(organizationId);

  if (!normalizedOrganizationId) {
    throw new ApiError(missingStatusCode, `${source} is required`);
  }

  if (!mongoose.Types.ObjectId.isValid(normalizedOrganizationId)) {
    throw new ApiError(invalidStatusCode, `${source} must be a valid ObjectId`);
  }

  return normalizedOrganizationId;
};

const buildOrganizationFilter = (organizationId, filter = {}) => {
  const normalizedOrganizationId = validateOrganizationId(organizationId);

  if (!filter || typeof filter !== 'object' || Array.isArray(filter)) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Scoped query filter must be an object');
  }

  if (filter.organizationId !== undefined && normalizeOrganizationId(filter.organizationId) !== normalizedOrganizationId) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Cross-organization query attempted');
  }

  return {
    ...filter,
    organizationId: normalizedOrganizationId,
  };
};

const safeQuery = (model, organizationId, filter = {}, projection = null, options = {}) => {
  if (!model || typeof model.find !== 'function') {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'safeQuery requires a valid Mongoose model');
  }

  return model.find(buildOrganizationFilter(organizationId, filter), projection, options);
};

const safeFindOne = (model, organizationId, filter = {}, projection = null, options = {}) => {
  if (!model || typeof model.findOne !== 'function') {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'safeFindOne requires a valid Mongoose model');
  }

  return model.findOne(buildOrganizationFilter(organizationId, filter), projection, options);
};

// Refs that point at tenant-owned (organizationGuard-protected) models.
const TENANT_SCOPED_REFS = ['itemId', 'inventoryId', 'orderId'];

/**
 * Build populate options that keep tenant-owned refs inside the organization.
 * Mongoose populate runs `Model.find({ _id: { $in: ids } })` without organizationId,
 * which the organizationGuard plugin rejects. Adding `match` scopes those lookups.
 * @param {string} organizationId
 * @param {string} paths - space-separated populate paths, e.g. 'inventoryId itemId createdBy'
 * @param {Object} [selectByPath] - optional field selection per path, e.g. { createdBy: 'name email' }
 * @returns {Object[]}
 */
const scopedPopulate = (organizationId, paths, selectByPath = {}) => {
  const normalizedOrganizationId = validateOrganizationId(organizationId);
  return paths
    .split(' ')
    .filter(Boolean)
    .map((path) => {
      const option = { path };
      if (TENANT_SCOPED_REFS.includes(path)) {
        option.match = { organizationId: normalizedOrganizationId };
      }
      if (selectByPath[path]) {
        option.select = selectByPath[path];
      }
      return option;
    });
};

module.exports = {
  scopedPopulate,
  validateOrganizationId,
  buildOrganizationFilter,
  safeQuery,
  safeFindOne,
};
