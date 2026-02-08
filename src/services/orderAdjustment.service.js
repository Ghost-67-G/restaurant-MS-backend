const httpStatus = require('http-status');
const OrderAdjustment = require('../models/orderAdjustment.model');
const Order = require('../models/order.model');
const { ADJUSTMENT_TYPE, ORDER_STATUS } = require('../config/constants');
const { eventEmitter, EVENTS } = require('../utils/eventEmitter');
const ApiError = require('../utils/ApiError');

/**
 * Create an order adjustment (refund or void)
 * @param {Object} adjustmentData
 * @param {ObjectId} adjustmentData.orderId
 * @param {string} adjustmentData.type - REFUND or VOID
 * @param {number} adjustmentData.amount
 * @param {string} adjustmentData.reason
 * @param {ObjectId} userId - User creating the adjustment
 * @returns {Promise<OrderAdjustment>}
 */
const createAdjustment = async (adjustmentData, userId) => {
  const { orderId, type, amount, reason } = adjustmentData;

  // Validate adjustment type
  if (!Object.values(ADJUSTMENT_TYPE).includes(type)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid adjustment type');
  }

  // Get the order
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  // Validation based on adjustment type
  if (type === ADJUSTMENT_TYPE.VOID) {
    // Can only void non-completed orders
    if (order.status === ORDER_STATUS.COMPLETED) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot void a completed order. Use refund instead.');
    }
    if (order.status === ORDER_STATUS.CANCELLED) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Order is already cancelled');
    }
    if (order.isVoided) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Order is already voided');
    }
  }

  if (type === ADJUSTMENT_TYPE.REFUND) {
    // Can only refund completed orders
    if (order.status !== ORDER_STATUS.COMPLETED) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Can only refund completed orders. Use void for pending orders.');
    }
    if (order.isVoided) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot refund a voided order');
    }

    // Check refund amount
    const maxRefundable = order.totalAmount - order.refundedAmount;
    if (amount > maxRefundable) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Refund amount cannot exceed ${maxRefundable.toFixed(2)}. Already refunded: ${order.refundedAmount.toFixed(2)}`
      );
    }
    if (amount <= 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Refund amount must be greater than 0');
    }
  }

  // Create the adjustment
  const adjustment = await OrderAdjustment.create({
    orderId,
    type,
    amount,
    reason,
    createdBy: userId,
  });

  // Update order status
  if (type === ADJUSTMENT_TYPE.VOID) {
    order.isVoided = true;
    order.status = ORDER_STATUS.CANCELLED;
    await order.save();

    // Emit void event (no inventory movement needed since order wasn't completed)
    eventEmitter.emitEvent(EVENTS.ORDER_VOIDED, {
      orderId: orderId.toString(),
      adjustmentId: adjustment._id.toString(),
      userId,
      reason,
    });
  } else if (type === ADJUSTMENT_TYPE.REFUND) {
    order.refundedAmount += amount;
    order.isRefunded = order.refundedAmount >= order.totalAmount;
    await order.save();

    // Emit refund event (inventory should be restored)
    eventEmitter.emitEvent(EVENTS.ORDER_REFUNDED, {
      orderId: orderId.toString(),
      adjustmentId: adjustment._id.toString(),
      userId,
      amount,
      reason,
      isFullRefund: order.isRefunded,
      order: order.toJSON(),
    });
  }

  return adjustment;
};

/**
 * Get adjustments for an order
 * @param {ObjectId} orderId
 * @returns {Promise<OrderAdjustment[]>}
 */
const getOrderAdjustments = async (orderId) => {
  return OrderAdjustment.find({ orderId }).populate('createdBy', 'name email').sort({ createdAt: -1 });
};

/**
 * Query adjustments
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryAdjustments = async (filter, options) => {
  const adjustments = await OrderAdjustment.paginate(filter, options);
  return adjustments;
};

/**
 * Get adjustment by id
 * @param {ObjectId} adjustmentId
 * @returns {Promise<OrderAdjustment>}
 */
const getAdjustmentById = async (adjustmentId) => {
  return OrderAdjustment.findById(adjustmentId).populate('createdBy', 'name email').populate('orderId');
};

module.exports = {
  createAdjustment,
  getOrderAdjustments,
  queryAdjustments,
  getAdjustmentById,
};
