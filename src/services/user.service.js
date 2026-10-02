const httpStatus = require('http-status');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { validateOrganizationId, buildOrganizationFilter, safeFindOne } = require('../utils/organizationGuard');
const organizationService = require('./organization.service');

const PLAN_LIMITS = {
  free: { maxUsers: 5, maxItems: 100, maxWarehouses: 1 },
  starter: { maxUsers: 20, maxItems: 2000, maxWarehouses: 3 },
  pro: { maxUsers: 200, maxItems: 50000, maxWarehouses: 50 },
};

const createOrganizationForSignup = async ({ name, plan = 'free' }) => {
  const selectedPlan = PLAN_LIMITS[plan] ? plan : 'free';

  return organizationService.createOrganization({
    name,
    plan: selectedPlan,
    limits: PLAN_LIMITS[selectedPlan],
    isActive: true,
  });
};

/**
 * Create a user
 * @param {ObjectId|string} organizationId
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (organizationId, userBody) => {
  const normalizedOrganizationId = validateOrganizationId(organizationId);

  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  return User.create({
    name: userBody.name,
    email: userBody.email,
    password: userBody.password,
    role: userBody.role || 'staff',
    organizationId: normalizedOrganizationId,
  });
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (organizationId, filter, options) => {
  validateOrganizationId(organizationId);
  const users = await User.paginate(buildOrganizationFilter(organizationId, filter), options);
  return users;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (organizationId, id) => {
  validateOrganizationId(organizationId);
  return safeFindOne(User, organizationId, { _id: id }).populate('organizationId');
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (organizationId, userId, updateBody) => {
  validateOrganizationId(organizationId);
  const user = await getUserById(organizationId, userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(user, {
    name: updateBody.name !== undefined ? updateBody.name : user.name,
    email: updateBody.email !== undefined ? updateBody.email : user.email,
    password: updateBody.password !== undefined ? updateBody.password : user.password,
    role: updateBody.role !== undefined ? updateBody.role : user.role,
  });
  await user.save();
  return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (organizationId, userId) => {
  validateOrganizationId(organizationId);
  const user = await getUserById(organizationId, userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.remove();
  return user;
};

module.exports = {
  createOrganizationForSignup,
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
};
