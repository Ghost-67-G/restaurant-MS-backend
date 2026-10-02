const Order = require('../models/order.model');
const { ORDER_STATUS } = require('../config/constants');
const { validateOrganizationId } = require('../utils/organizationGuard');

/**
 * Get dashboard statistics for today
 * @returns {Promise<Object>}
 */
const getTodayStats = async (organizationId) => {
  validateOrganizationId(organizationId);
  // Get start and end of today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // Aggregate today's orders
  const stats = await Order.aggregate([
    {
      $match: {
        organizationId,
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      },
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSales: { $sum: '$totalAmount' },
        pendingOrders: {
          $sum: {
            $cond: [{ $eq: ['$status', ORDER_STATUS.PENDING] }, 1, 0],
          },
        },
        completedOrders: {
          $sum: {
            $cond: [{ $eq: ['$status', ORDER_STATUS.COMPLETED] }, 1, 0],
          },
        },
      },
    },
  ]);

  // If no orders today, return zeros
  if (stats.length === 0) {
    return {
      totalOrders: 0,
      totalSales: 0,
      pendingOrders: 0,
      completedOrders: 0,
    };
  }

  const result = stats[0];
  return {
    totalOrders: result.totalOrders,
    totalSales: result.totalSales,
    pendingOrders: result.pendingOrders,
    completedOrders: result.completedOrders,
  };
};

module.exports = {
  getTodayStats,
};
