const logger = require('../config/logger');
const Order = require('../models/order.model');
const { Inventory } = require('../models');
const inventoryLedgerService = require('../services/inventoryLedger.service');
const invoiceService = require('../services/invoice.service');

/**
 * Apply inventory movement for an order.
 */
const applyInventoryMovement = async (order, userId, quantityFactor, referenceType, reason) => {
  const movementPromises = order.items.map(async (item) => {
    try {
      const inventory = await Inventory.findOne({
        organizationId: order.organizationId,
        itemId: item.itemId,
      });

      if (!inventory) {
        logger.warn(`No inventory record found for item ${item.itemId} on order ${order.id}`);
        return;
      }

      await inventoryLedgerService.createLedgerEntry(order.organizationId, {
        organizationId: order.organizationId,
        inventoryId: inventory.id,
        itemId: inventory.itemId,
        type: quantityFactor > 0 ? 'IN' : 'OUT',
        quantity: quantityFactor * Math.abs(item.quantity),
        reason,
        referenceType,
        referenceId: order.id,
        createdBy: userId,
      });
    } catch (error) {
      logger.error(`Failed inventory movement for item ${item.itemId} on order ${order.id}:`, error);
    }
  });

  await Promise.all(movementPromises);
};

const handleOrderCompleted = async (eventData) => {
  const { orderId, userId, previousStatus, organizationId } = eventData;

  try {
    logger.info(`Processing order completion: ${orderId}`);

    const order = await Order.findOne({ _id: orderId, organizationId });
    if (!order) {
      logger.error(`Order not found: ${orderId}`);
      return;
    }

    if (previousStatus === 'completed') {
      logger.warn(`Order ${orderId} already completed - skipping`);
      return;
    }

    await applyInventoryMovement(order, userId, -1, 'ORDER', 'Order completed');

    try {
      const invoice = await invoiceService.createInvoice(organizationId, orderId, { organizationId, id: userId });
      logger.info(`Invoice ${invoice.invoiceNumber} generated for order ${orderId}`);
    } catch (invoiceError) {
      logger.error(`Failed to generate invoice for order ${orderId}:`, invoiceError);
    }

    logger.info(`Successfully processed order completion: ${orderId}`);
  } catch (error) {
    logger.error(`Error processing ORDER_COMPLETED event for order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Handle order cancellation.
 */
const handleOrderCancelled = async (eventData) => {
  const { orderId, previousStatus, organizationId } = eventData;

  try {
    logger.info(`Processing order cancellation: ${orderId}`);

    const order = await Order.findOne({ _id: orderId, organizationId });
    if (!order) {
      logger.error(`Order not found: ${orderId}`);
      return;
    }

    if (previousStatus === 'completed') {
      logger.warn(`Order ${orderId} was cancelled after completion. Use refunds to restore stock.`);
    }
  } catch (error) {
    logger.error(`Error processing ORDER_CANCELLED event for order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Log order creation for analytics
 *
 * @param {Object} eventData - Event data
 * @param {string} eventData.orderId - Order ID
 */
const handleOrderCreated = async (eventData) => {
  const { orderId } = eventData;
  logger.info(`Order created: ${orderId}`);
};

/**
 * Log order updates for analytics
 *
 * @param {Object} eventData - Event data
 * @param {string} eventData.orderId - Order ID
 */
const handleOrderUpdated = async (eventData) => {
  const { orderId, status } = eventData;
  logger.info(`Order updated: ${orderId} - Status: ${status}`);
};

/**
 * Handle order refund - restore inventory
 *
 * @param {Object} eventData - Event data
 * @param {string} eventData.orderId - Order ID
 * @param {string} eventData.userId - User who initiated the refund
 * @param {number} eventData.amount - Refund amount
 * @param {boolean} eventData.isFullRefund - Whether this is a full refund
 */
const handleOrderRefunded = async (eventData) => {
  const { orderId, userId, isFullRefund, reason, organizationId } = eventData;

  try {
    logger.info(`Processing inventory restoration for refunded order: ${orderId}`);

    const order = await Order.findOne({ _id: orderId, organizationId });
    if (!order) {
      logger.error(`Order not found: ${orderId}`);
      return;
    }

    if (!isFullRefund) {
      logger.info(`Partial refund for order ${orderId} - manual inventory adjustment may be needed`);
      return;
    }

    logger.info(`Full refund detected for order ${orderId} - restoring inventory`);

    await applyInventoryMovement(order, userId, 1, 'REFUND', `Refund: ${reason}`);

    logger.info(`Successfully processed inventory restoration for refunded order: ${orderId}`);
  } catch (error) {
    logger.error(`Error processing ORDER_REFUNDED event for order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Handle order void - no inventory movement needed
 *
 * @param {Object} eventData - Event data
 * @param {string} eventData.orderId - Order ID
 * @param {string} eventData.reason - Void reason
 */
const handleOrderVoided = async (eventData) => {
  const { orderId, reason } = eventData;

  try {
    logger.info(`Order voided: ${orderId} - Reason: ${reason}`);

    // No inventory movement needed since order was never completed
    logger.info(`No inventory restoration needed for voided order ${orderId}`);
  } catch (error) {
    logger.error(`Error processing ORDER_VOIDED event for order ${orderId}:`, error);
  }
};

module.exports = {
  handleOrderCompleted,
  handleOrderCancelled,
  handleOrderCreated,
  handleOrderUpdated,
  handleOrderRefunded,
  handleOrderVoided,
};
