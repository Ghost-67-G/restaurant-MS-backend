const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');

const extractBearerToken = (authorizationHeader) => {
  if (!authorizationHeader || typeof authorizationHeader !== 'string') {
    return null;
  }

  if (!authorizationHeader.startsWith('Bearer ')) {
    return null;
  }

  return authorizationHeader.slice('Bearer '.length).trim() || null;
};

const resolveOrganizationId = (req) => {
  if (req.user && req.user.organizationId) {
    return req.user.organizationId.toString();
  }

  const bearerToken = extractBearerToken(req.headers.authorization);
  if (!bearerToken) {
    return null;
  }

  try {
    const payload = jwt.verify(bearerToken, config.jwt.secret);
    return payload.organizationId ? String(payload.organizationId) : null;
  } catch (error) {
    return null;
  }
};

const attachOrganization = (req, res, next) => {
  const organizationId = resolveOrganizationId(req);

  if (!organizationId) {
    return next();
  }

  req.organizationId = organizationId;

  if (req.user) {
    req.user.organizationId = organizationId;
  }

  return next();
};

const requireOrganization = (req, res, next) => {
  if (!req.organizationId) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Organization context not found in token'));
  }

  return next();
};

module.exports = {
  attachOrganization,
  requireOrganization,
  resolveOrganizationId,
};
