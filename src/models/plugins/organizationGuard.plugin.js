const mongoose = require('mongoose');
const httpStatus = require('http-status');
const ApiError = require('../../utils/ApiError');
const { validateOrganizationId } = require('../../utils/organizationGuard');

const QUERY_OPERATIONS = [
  'countDocuments',
  'deleteMany',
  'deleteOne',
  'find',
  'findOne',
  'findOneAndDelete',
  'findOneAndRemove',
  'findOneAndUpdate',
  'updateMany',
  'updateOne',
];

/**
 * Mongoose 5 `document.save()` with no changes runs `Model.exists({ _id })`
 * (findOne + select {_id: 1} + lean) to confirm the document still exists.
 * That lookup is by a single _id and returns only the _id, so it cannot leak
 * tenant data. Without this exception every no-op save on a tenant model fails.
 */
const isSaveExistenceCheck = (query) => {
  const filter = (typeof query.getFilter === 'function' && query.getFilter()) || {};
  const filterKeys = Object.keys(filter).filter((key) => key !== '__v');
  const fields = query._fields || {};
  const fieldKeys = Object.keys(fields);
  return (
    query.op === 'findOne' &&
    Boolean(query._mongooseOptions && query._mongooseOptions.lean) &&
    filterKeys.length === 1 &&
    filterKeys[0] === '_id' &&
    mongoose.Types.ObjectId.isValid(filter._id) &&
    fieldKeys.length === 1 &&
    fieldKeys[0] === '_id'
  );
};

const organizationGuardPlugin = (schema) => {
  const ensureScopedQuery = function (next) {
    try {
      const queryOptions = typeof this.getOptions === 'function' ? this.getOptions() : {};
      if (queryOptions && queryOptions.skipOrganizationGuard) {
        return next();
      }

      if (isSaveExistenceCheck(this)) {
        return next();
      }

      const filter = typeof this.getFilter === 'function' ? this.getFilter() : {};
      validateOrganizationId(filter.organizationId, {
        source: 'organizationId query scope',
        missingStatusCode: httpStatus.INTERNAL_SERVER_ERROR,
        invalidStatusCode: httpStatus.INTERNAL_SERVER_ERROR,
      });

      return next();
    } catch (error) {
      return next(error);
    }
  };

  QUERY_OPERATIONS.forEach((operation) => {
    schema.pre(operation, ensureScopedQuery);
  });

  schema.pre('aggregate', function (next) {
    try {
      const aggregateOptions = this.options || {};
      if (aggregateOptions.skipOrganizationGuard) {
        return next();
      }

      const pipeline = this.pipeline();
      const firstStage = pipeline[0];
      const organizationId = firstStage && firstStage.$match ? firstStage.$match.organizationId : null;

      validateOrganizationId(organizationId, {
        source: 'organizationId aggregate scope',
        missingStatusCode: httpStatus.INTERNAL_SERVER_ERROR,
        invalidStatusCode: httpStatus.INTERNAL_SERVER_ERROR,
      });

      return next();
    } catch (error) {
      return next(error instanceof ApiError ? error : new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message));
    }
  });
};

module.exports = organizationGuardPlugin;
