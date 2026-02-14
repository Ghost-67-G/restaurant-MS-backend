const { eventEmitter, EVENTS } = require('../utils/eventEmitter');
const orderEvents = require('./orderEvents');
const logger = require('../config/logger');
const EventLog = require('../models/eventLog.model');

/**
 * Create event log entry for tracking
 * @param {string} eventName
 * @param {Object} eventData
 * @returns {Promise<EventLog>}
 */
const createEventLog = async (eventName, eventData) => {
  try {
    return await EventLog.create({
      eventName,
      eventData,
      status: 'pending',
    });
  } catch (error) {
    logger.error('Failed to create event log:', error);
    return null;
  }
};

/**
 * Update event log status
 * @param {ObjectId} logId
 * @param {string} status
 * @param {string} error
 */
const updateEventLog = async (logId, status, error = null) => {
  try {
    if (!logId) return;
    
    const update = {
      status,
      processingCompletedAt: new Date(),
    };
    
    if (error) {
      update.error = error;
    }
    
    await EventLog.findByIdAndUpdate(logId, update);
  } catch (err) {
    logger.error('Failed to update event log:', err);
  }
};

/**
 * Register all event handlers
 * This should be called once during application startup
 */
const registerEventHandlers = () => {
  logger.info('Registering event handlers...');

  // Order event handlers
  eventEmitter.on(EVENTS.ORDER_CREATED, async (data) => {
    try {
      await orderEvents.handleOrderCreated(data);
    } catch (error) {
      logger.error('Error in ORDER_CREATED handler:', error);
    }
  });

  eventEmitter.on(EVENTS.ORDER_UPDATED, async (data) => {
    try {
      await orderEvents.handleOrderUpdated(data);
    } catch (error) {
      logger.error('Error in ORDER_UPDATED handler:', error);
    }
  });

  eventEmitter.on(EVENTS.ORDER_READY, async (data) => {
    const logId = await createEventLog(EVENTS.ORDER_READY, data);
    try {
      if (logId) {
        await EventLog.findByIdAndUpdate(logId, {
          status: 'processing',
          processingStartedAt: new Date(),
        });
      }
      await orderEvents.handleOrderReady(data);
      await updateEventLog(logId, 'completed');
    } catch (error) {
      logger.error('Error in ORDER_READY handler:', error);
      await updateEventLog(logId, 'failed', error.message);
    }
  });

  eventEmitter.on(EVENTS.ORDER_COMPLETED, async (data) => {
    const logId = await createEventLog(EVENTS.ORDER_COMPLETED, data);
    try {
      if (logId) {
        await EventLog.findByIdAndUpdate(logId, {
          status: 'processing',
          processingStartedAt: new Date(),
        });
      }
      await orderEvents.handleOrderCompleted(data);
      await updateEventLog(logId, 'completed');
    } catch (error) {
      logger.error('Error in ORDER_COMPLETED handler:', error);
      await updateEventLog(logId, 'failed', error.message);
      // Critical error - might want to alert admins or add to retry queue
    }
  });

  eventEmitter.on(EVENTS.ORDER_CANCELLED, async (data) => {
    const logId = await createEventLog(EVENTS.ORDER_CANCELLED, data);
    try {
      if (logId) {
        await EventLog.findByIdAndUpdate(logId, {
          status: 'processing',
          processingStartedAt: new Date(),
        });
      }
      await orderEvents.handleOrderCancelled(data);
      await updateEventLog(logId, 'completed');
    } catch (error) {
      logger.error('Error in ORDER_CANCELLED handler:', error);
      await updateEventLog(logId, 'failed', error.message);
    }
  });

  eventEmitter.on(EVENTS.ORDER_REFUNDED, async (data) => {
    const logId = await createEventLog(EVENTS.ORDER_REFUNDED, data);
    try {
      if (logId) {
        await EventLog.findByIdAndUpdate(logId, {
          status: 'processing',
          processingStartedAt: new Date(),
        });
      }
      await orderEvents.handleOrderRefunded(data);
      await updateEventLog(logId, 'completed');
    } catch (error) {
      logger.error('Error in ORDER_REFUNDED handler:', error);
      await updateEventLog(logId, 'failed', error.message);
    }
  });

  eventEmitter.on(EVENTS.ORDER_VOIDED, async (data) => {
    const logId = await createEventLog(EVENTS.ORDER_VOIDED, data);
    try {
      if (logId) {
        await EventLog.findByIdAndUpdate(logId, {
          status: 'processing',
          processingStartedAt: new Date(),
        });
      }
      await orderEvents.handleOrderVoided(data);
      await updateEventLog(logId, 'completed');
    } catch (error) {
      logger.error('Error in ORDER_VOIDED handler:', error);
      await updateEventLog(logId, 'failed', error.message);
    }
  });

  // Add more event handlers as needed
  // Example: Inventory events, user events, etc.

  logger.info('Event handlers registered successfully');
};

/**
 * Unregister all event handlers
 * Useful for testing or graceful shutdown
 */
const unregisterEventHandlers = () => {
  logger.info('Unregistering event handlers...');
  eventEmitter.removeAllListeners();
  logger.info('Event handlers unregistered');
};

module.exports = {
  registerEventHandlers,
  unregisterEventHandlers,
};
