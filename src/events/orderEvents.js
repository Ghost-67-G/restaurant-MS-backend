const logger = require('../config/logger');
const MenuItem = require('../models/menuItem.model');
const Order = require('../models/order.model');
const recipeService = require('../services/recipe.service');
const inventoryService = require('../services/inventory.service');
const invoiceService = require('../services/invoice.service');

/**
 * Handle inventory deduction when an order is ready
 * Ingredients are deducted at "ready" status (food is prepared)
 *
 * @param {Object} eventData - Event data
 * @param {string} eventData.orderId - Order ID
 * @param {string} eventData.userId - User who marked the order as ready
 */
const handleOrderReady = async (eventData) => {
  const { orderId, userId, previousStatus } = eventData;

  try {
    logger.info(`Processing inventory deduction for ready order: ${orderId}`);

    // Fetch the order
    const order = await Order.findById(orderId);
    if (!order) {
      logger.error(`Order not found: ${orderId}`);
      return;
    }

    // Check if already processed (prevents double deduction)
    if (previousStatus === 'ready') {
      logger.warn(`Order ${orderId} already ready - skipping inventory deduction`);
      return;
    }

    // Process each item in the order
    const deductionResults = [];
    const deductionPromises = order.items.map(async (item) => {
      try {
        // Get the menu item to find its linked inventory
        const menuItem = await MenuItem.findById(item.menuItemId);
        
        // First, try to deduct ingredients using new recipe system with ledger
        try {
          await recipeService.deductIngredientsForMenuItem(item.menuItemId, item.quantity, orderId, userId);
          logger.info(`Deducted ingredients for menu item ${item.menuItemId} using recipe system`);
          deductionResults.push({ menuItemId: item.menuItemId, success: true, method: 'recipe' });
        } catch (recipeError) {
          // If recipe-based deduction fails, fall back to old inventory system for backward compatibility
          if (menuItem && menuItem.inventoryItemId) {
            await inventoryService.reduceInventory(menuItem.inventoryItemId, item.quantity);
            logger.info(`Deducted inventory for menu item ${item.menuItemId} using legacy system`);
            deductionResults.push({ menuItemId: item.menuItemId, success: true, method: 'legacy' });
          } else {
            logger.warn(
              `No recipe or inventory link for menu item ${item.menuItemId}: ${recipeError.message}. `
                + `Please configure recipes for this menu item.`
            );
            deductionResults.push({ menuItemId: item.menuItemId, success: false, reason: recipeError.message });
          }
        }
      } catch (itemError) {
        logger.error(`Failed to deduct inventory for item ${item.menuItemId}:`, itemError);
        deductionResults.push({ menuItemId: item.menuItemId, success: false, reason: itemError.message });
      }
    });

    // Process all items in parallel
    await Promise.all(deductionPromises);

    const failed = deductionResults.filter((r) => !r.success);
    if (failed.length > 0) {
      logger.warn(
        `Inventory deduction partially failed for order ${orderId}: ${failed.length} items had no recipe configured`
      );
    }

    logger.info(
      `Processed inventory deduction for order: ${orderId} (${deductionResults.filter((r) => r.success).length}/${
        deductionResults.length
      } items)`
    );
  } catch (error) {
    logger.error(`Error processing ORDER_READY event for order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Handle order completion - generate invoice
 * Inventory was already deducted at "ready" status
 *
 * @param {Object} eventData - Event data
 * @param {string} eventData.orderId - Order ID
 * @param {string} eventData.userId - User who completed the order
 */
const handleOrderCompleted = async (eventData) => {
  const { orderId, userId, previousStatus } = eventData;

  try {
    logger.info(`Processing order completion: ${orderId}`);

    // Fetch the order
    const order = await Order.findById(orderId);
    if (!order) {
      logger.error(`Order not found: ${orderId}`);
      return;
    }

    // Check if already processed (prevents double processing)
    if (previousStatus === 'completed') {
      logger.warn(`Order ${orderId} already completed - skipping`);
      return;
    }

    // If order went directly to completed (skipped ready), deduct inventory here
    if (previousStatus !== 'ready') {
      logger.info(`Order ${orderId} skipped ready status - deducting inventory now`);
      const deductionPromises = order.items.map(async (item) => {
        try {
          const menuItem = await MenuItem.findById(item.menuItemId);
          try {
            await recipeService.deductIngredientsForMenuItem(item.menuItemId, item.quantity, orderId, userId);
            logger.info(`Deducted ingredients for menu item ${item.menuItemId} using recipe system`);
          } catch (recipeError) {
            if (menuItem && menuItem.inventoryItemId) {
              await inventoryService.reduceInventory(menuItem.inventoryItemId, item.quantity);
              logger.info(`Deducted inventory for menu item ${item.menuItemId} using legacy system`);
            } else {
              logger.warn(`No recipe or inventory link for menu item ${item.menuItemId}: ${recipeError.message}`);
            }
          }
        } catch (itemError) {
          logger.error(`Failed to deduct inventory for item ${item.menuItemId}:`, itemError);
        }
      });
      await Promise.all(deductionPromises);
    }

    // Generate invoice for the completed order
    try {
      const invoice = await invoiceService.createInvoice(orderId, userId);
      logger.info(`Invoice ${invoice.invoiceNumber} generated for order ${orderId}`);
    } catch (invoiceError) {
      // Don't fail the whole process if invoice generation fails
      logger.error(`Failed to generate invoice for order ${orderId}:`, invoiceError);
    }

    logger.info(`Successfully processed order completion: ${orderId}`);
  } catch (error) {
    logger.error(`Error processing ORDER_COMPLETED event for order ${orderId}:`, error);
    throw error;
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

    // Only restore inventory if order was previously ready or completed (inventory was deducted)
    if (previousStatus !== 'completed' && previousStatus !== 'ready') {
      logger.info(`Order ${orderId} was not ready/completed - no inventory restoration needed`);
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
  const { orderId, userId, isFullRefund, reason } = eventData;

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
  handleOrderReady,
  handleOrderCompleted,
  handleOrderCancelled,
  handleOrderCreated,
  handleOrderUpdated,
  handleOrderRefunded,
  handleOrderVoided,
};
