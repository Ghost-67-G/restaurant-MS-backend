const logger = require('../config/logger');
const MenuItem = require('../models/menuItem.model');
const Order = require('../models/order.model');
const recipeService = require('../services/recipe.service');
const inventoryService = require('../services/inventory.service');
const invoiceService = require('../services/invoice.service');

/**
 * Handle inventory deduction when an order is completed
 * This decouples inventory logic from order controller
 *
 * @param {Object} eventData - Event data
 * @param {string} eventData.orderId - Order ID
 * @param {string} eventData.userId - User who completed the order
 */
const handleOrderCompleted = async (eventData) => {
  const { orderId, userId, previousStatus } = eventData;

  try {
    logger.info(`Processing inventory deduction for completed order: ${orderId}`);

    // Fetch the order
    const order = await Order.findById(orderId);
    if (!order) {
      logger.error(`Order not found: ${orderId}`);
      return;
    }

    // Check if already processed (prevents double deduction)
    if (previousStatus === 'completed') {
      logger.warn(`Order ${orderId} already completed - skipping inventory deduction`);
      return;
    }

    // Process each item in the order
    const deductionPromises = order.items.map(async (item) => {
      try {
        // Get the menu item to find its linked inventory
        const menuItem = await MenuItem.findById(item.menuItemId);
        
        // First, try to deduct ingredients using new recipe system with ledger
        try {
          await recipeService.deductIngredientsForMenuItem(item.menuItemId, item.quantity, orderId, userId);
          logger.info(`Deducted ingredients for menu item ${item.menuItemId} using recipe system`);
        } catch (error) {
          // If recipe-based deduction fails, fall back to old inventory system for backward compatibility
          if (menuItem && menuItem.inventoryItemId) {
            await inventoryService.reduceInventory(menuItem.inventoryItemId, item.quantity);
            logger.info(`Deducted inventory for menu item ${item.menuItemId} using legacy system`);
          } else {
            // Re-throw if no fallback available
            throw error;
          }
        }
      } catch (itemError) {
        logger.error(`Failed to deduct inventory for item ${item.menuItemId}:`, itemError);
        throw itemError;
      }
    });

    // Process all items in parallel
    await Promise.all(deductionPromises);

    logger.info(`Successfully processed inventory deduction for order: ${orderId}`);

    // Generate invoice for the completed order
    try {
      const invoice = await invoiceService.createInvoice(orderId, userId);
      logger.info(`Invoice ${invoice.invoiceNumber} generated for order ${orderId}`);
    } catch (invoiceError) {
      // Don't fail the whole process if invoice generation fails
      logger.error(`Failed to generate invoice for order ${orderId}:`, invoiceError);
      // Invoice can be generated manually later if needed
    }
  } catch (error) {
    logger.error(`Error processing ORDER_COMPLETED event for order ${orderId}:`, error);
    
    // In production, you might want to:
    // 1. Mark the order for manual review
    // 2. Send alert to admins
    // 3. Store in a dead-letter queue for retry
    
    throw error; // Re-throw to trigger any error handlers
  }
};

/**
 * Handle inventory restoration when an order is cancelled
 * (Future implementation for refunds/cancellations)
 *
 * @param {Object} eventData - Event data
 * @param {string} eventData.orderId - Order ID
 * @param {string} eventData.userId - User who cancelled the order
 */
const handleOrderCancelled = async (eventData) => {
  const { orderId, previousStatus } = eventData;

  try {
    logger.info(`Processing order cancellation: ${orderId}`);

    // Fetch the order
    const order = await Order.findById(orderId);
    if (!order) {
      logger.error(`Order not found: ${orderId}`);
      return;
    }

    // Only restore inventory if order was previously completed
    if (previousStatus !== 'completed') {
      logger.info(`Order ${orderId} was not completed - no inventory restoration needed`);
      return;
    }

    logger.info(`Order ${orderId} cancellation detected after completion - inventory restoration required`);
    
    // TODO: Implement inventory restoration logic
    // This would create positive ledger entries to restore stock
    // For now, just log it for manual handling
    
    logger.warn(`Manual inventory restoration required for cancelled order ${orderId}`);
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
  
  // Future: Send to analytics, update metrics, etc.
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
  
  // Future: Send to analytics, update metrics, etc.
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
  const { orderId, userId, amount, isFullRefund, reason } = eventData;

  try {
    logger.info(`Processing inventory restoration for refunded order: ${orderId}`);

    // Fetch the order
    const order = await Order.findById(orderId);
    if (!order) {
      logger.error(`Order not found: ${orderId}`);
      return;
    }

    // Only restore inventory for full refunds to keep it simple
    // Partial refunds would require manual inventory adjustment
    if (!isFullRefund) {
      logger.info(`Partial refund for order ${orderId} - manual inventory adjustment may be needed`);
      return;
    }

    logger.info(`Full refund detected for order ${orderId} - restoring inventory`);

    // Process each item in the order
    const restorationPromises = order.items.map(async (item) => {
      try {
        const menuItem = await MenuItem.findById(item.menuItemId);
        
        // Try to restore ingredients using recipe system
        try {
          // Create positive ledger entries to restore stock
          await recipeService.restoreIngredientsForMenuItem(
            item.menuItemId,
            item.quantity,
            orderId,
            userId,
            `Refund: ${reason}`
          );
          logger.info(`Restored ingredients for menu item ${item.menuItemId} via recipe system`);
        } catch (error) {
          // If recipe-based restoration fails, fall back to old inventory system
          if (menuItem && menuItem.inventoryItemId) {
            await inventoryService.increaseInventory(menuItem.inventoryItemId, item.quantity);
            logger.info(`Restored inventory for menu item ${item.menuItemId} via legacy system`);
          } else {
            logger.warn(`Could not restore inventory for item ${item.menuItemId}:`, error.message);
          }
        }
      } catch (itemError) {
        logger.error(`Failed to restore inventory for item ${item.menuItemId}:`, itemError);
        // Don't throw - continue with other items
      }
    });

    await Promise.all(restorationPromises);

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
