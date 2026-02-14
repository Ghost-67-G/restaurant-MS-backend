const EventEmitter = require('events');
const logger = require('../config/logger');

/**
 * Custom event emitter for application events
 * Extends Node.js EventEmitter with logging and error handling
 */
class AppEventEmitter extends EventEmitter {
  constructor() {
    super();
    
    // Set higher max listeners to avoid warnings (default is 10)
    this.setMaxListeners(20);
    
    // Log all emitted events in development
    if (process.env.NODE_ENV === 'development') {
      this.onAny((event, ...args) => {
        logger.debug(`Event emitted: ${event}`, { data: args });
      });
    }
  }

  /**
   * Emit an event with automatic error handling and logging
   * @param {string} event - Event name
   * @param {Object} data - Event data
   * @returns {boolean}
   */
  emitEvent(event, data) {
    try {
      logger.info(`Emitting event: ${event}`, { event, data });
      return this.emit(event, data);
    } catch (error) {
      logger.error(`Error emitting event: ${event}`, { error: error.message, event, data });
      throw error;
    }
  }

  /**
   * Listen for all events (helper for debugging)
   * @param {Function} handler
   */
  onAny(handler) {
    const originalEmit = this.emit;
    this.emit = function (event, ...args) {
      handler(event, ...args);
      return originalEmit.apply(this, [event, ...args]);
    };
  }
}

// Export singleton instance
const eventEmitter = new AppEventEmitter();

// Define event names as constants to avoid typos
const EVENTS = {
  // Order events
  ORDER_CREATED: 'order:created',
  ORDER_UPDATED: 'order:updated',
  ORDER_READY: 'order:ready',
  ORDER_COMPLETED: 'order:completed',
  ORDER_CANCELLED: 'order:cancelled',
  ORDER_VOIDED: 'order:voided',
  ORDER_REFUNDED: 'order:refunded',
  
  // Inventory events
  INVENTORY_LOW: 'inventory:low',
  INVENTORY_OUT: 'inventory:out',
  
  // User events
  USER_CREATED: 'user:created',
  USER_DELETED: 'user:deleted',
};

module.exports = {
  eventEmitter,
  EVENTS,
};
