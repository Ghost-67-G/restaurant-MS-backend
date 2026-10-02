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

const organizationGuardPlugin = (schema) => {
  const ensureScopedQuery = function (next) {
    try {
      const queryOptions = typeof this.getOptions === 'function' ? this.getOptions() : {};
      if (queryOptions && queryOptions.skipOrganizationGuard) {
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
