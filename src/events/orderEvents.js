const logger = require('../config/logger');
const MenuItem = require('../models/menuItem.model');
const Order = require('../models/order.model');
const recipeService = require('../services/recipe.service');
const inventoryService = require('../services/inventory.service');

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

module.exports = {
  handleOrderCompleted,
  handleOrderCancelled,
  handleOrderCreated,
  handleOrderUpdated,
};
