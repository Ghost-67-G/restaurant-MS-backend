const Order = require('../models/order.model');
const OrderAdjustment = require('../models/orderAdjustment.model');
const { ADJUSTMENT_TYPE, ORDER_STATUS } = require('../config/constants');
const { validateOrganizationId } = require('../utils/organizationGuard');

const getDefaultDateRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const parseLocalDateInput = (dateStr) => {
  if (!dateStr) return null;

  const [year, month, day] = String(dateStr)
    .split('-')
    .map((part) => Number(part));

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
};

const parseDateRange = (from, to) => {
  const { start: defaultStart, end: defaultEnd } = getDefaultDateRange();

  const start = parseLocalDateInput(from) || defaultStart;
  const end = parseLocalDateInput(to) || defaultEnd;

  // Always normalize to full-day boundaries.
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const getSummary = async (organizationId, filters = {}) => {
  validateOrganizationId(organizationId);
  const { from, to, includeCancelled = false, includeRefunded = true, topLimit = 10 } = filters;

  const { start, end } = parseDateRange(from, to);

  const orderMatch = {
    organizationId,
    createdAt: {
      $gte: start,
      $lte: end,
    },
  };

  if (!includeCancelled) {
    orderMatch.status = { $nin: [ORDER_STATUS.CANCELLED, ORDER_STATUS.VOIDED] };
  }

  const [orderStats = null] = await Order.aggregate([
    { $match: orderMatch },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        grossSales: { $sum: '$totalAmount' },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', ORDER_STATUS.COMPLETED] }, 1, 0] },
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ['$status', ORDER_STATUS.CANCELLED] }, 1, 0] },
        },
        totalDiscount: { $sum: { $ifNull: ['$discountAmount', 0] } },
        totalTax: { $sum: { $ifNull: ['$taxAmount', 0] } },
      },
    },
  ]);

  const paymentMethodBreakdown = await Order.aggregate([
    { $match: orderMatch },
    {
      $group: {
        _id: '$paymentMethod',
        orders: { $sum: 1 },
        sales: { $sum: '$totalAmount' },
      },
    },
    { $sort: { orders: -1 } },
  ]);

  const dailySales = await Order.aggregate([
    { $match: orderMatch },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
          },
        },
        orders: { $sum: 1 },
        sales: { $sum: '$totalAmount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const topSellingItems = await Order.aggregate([
    { $match: orderMatch },
    { $unwind: '$items' },
    {
      $addFields: {
        itemModifierUnitTotal: {
          $sum: {
            $map: {
              input: { $ifNull: ['$items.selectedOptions', []] },
              as: 'option',
              in: { $ifNull: ['$$option.priceAdjustment', 0] },
            },
          },
        },
      },
    },
    {
      $group: {
        _id: {
          itemId: '$items.itemId',
          name: '$items.name',
        },
        quantitySold: { $sum: '$items.quantity' },
        sales: {
          $sum: {
            $multiply: [
              {
                $add: [{ $ifNull: ['$items.unitPrice', 0] }, '$itemModifierUnitTotal'],
              },
              '$items.quantity',
            ],
          },
        },
      },
    },
    { $sort: { quantitySold: -1, sales: -1 } },
    { $limit: Number(topLimit) },
  ]);

  const adjustmentPipeline = [
    {
      $match: {
        createdAt: {
          $gte: start,
          $lte: end,
        },
        organizationId,
      },
    },
    {
      $lookup: {
        from: 'orders',
        localField: 'orderId',
        foreignField: '_id',
        as: 'order',
      },
    },
    { $unwind: '$order' },
  ];

  adjustmentPipeline.push(
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } }
  );

  const adjustmentStats = await OrderAdjustment.aggregate(adjustmentPipeline);

  const adjustmentMap = adjustmentStats.reduce((acc, item) => {
    acc[item._id] = item;
    return acc;
  }, {});

  const totalRefunds = adjustmentMap[ADJUSTMENT_TYPE.REFUND] ? adjustmentMap[ADJUSTMENT_TYPE.REFUND].totalAmount : 0;
  const totalVoids = adjustmentMap[ADJUSTMENT_TYPE.VOID] ? adjustmentMap[ADJUSTMENT_TYPE.VOID].totalAmount : 0;

  const grossSales = orderStats ? orderStats.grossSales : 0;
  const totalOrders = orderStats ? orderStats.totalOrders : 0;
  const netSales = grossSales - totalVoids - (includeRefunded ? totalRefunds : 0);
  const averageOrderValue = totalOrders > 0 ? grossSales / totalOrders : 0;

  return {
    period: {
      from: start.toISOString(),
      to: end.toISOString(),
    },
    filters: {
      includeCancelled,
      includeRefunded,
    },
    kpis: {
      totalOrders,
      completedOrders: orderStats ? orderStats.completedOrders : 0,
      cancelledOrders: orderStats ? orderStats.cancelledOrders : 0,
      grossSales,
      netSales,
      averageOrderValue,
      totalDiscount: orderStats ? orderStats.totalDiscount : 0,
      totalTax: orderStats ? orderStats.totalTax : 0,
      totalRefunds,
      totalVoids,
    },
    breakdown: {
      paymentMethods: paymentMethodBreakdown.map((entry) => ({
        paymentMethod: entry._id,
        orders: entry.orders,
        sales: entry.sales,
      })),
      dailySales: dailySales.map((entry) => ({
        date: entry._id,
        orders: entry.orders,
        sales: entry.sales,
      })),
      topSellingItems: topSellingItems.map((entry) => ({
        itemId: entry._id.itemId,
        name: entry._id.name,
        quantitySold: entry.quantitySold,
        sales: entry.sales,
      })),
    },
  };
};

module.exports = {
  getSummary,
};
