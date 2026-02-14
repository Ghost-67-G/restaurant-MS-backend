const { StockAlert, Inventory } = require('../models');

/**
 * Check all ingredients and create alerts for low stock
 * @returns {Promise<Array>}
 */
const checkAndCreateAlerts = async () => {
  const ingredients = await Inventory.find({});

  const alertPromises = ingredients
    .filter((ingredient) => ingredient.quantity <= ingredient.lowStockThreshold)
    .map(async (ingredient) => {
      // Check if there's already a pending alert for this ingredient
      const existingAlert = await StockAlert.findOne({
        ingredientId: ingredient.id,
        status: 'PENDING',
      });

      if (!existingAlert) {
        const alert = await StockAlert.create({
          ingredientId: ingredient.id,
          currentStock: ingredient.quantity,
          threshold: ingredient.lowStockThreshold,
        });
        return alert;
      }
      return null;
    });

  const results = await Promise.all(alertPromises);
  return results.filter((alert) => alert !== null);
};

/**
 * Check single ingredient and create alert if needed
 * @param {ObjectId} ingredientId
 * @returns {Promise<StockAlert|null>}
 */
const checkIngredientStock = async (ingredientId) => {
  const ingredient = await Inventory.findById(ingredientId);
  
  if (!ingredient) {
    return null;
  }

  if (ingredient.quantity <= ingredient.lowStockThreshold) {
    // Check if there's already a pending alert
    const existingAlert = await StockAlert.findOne({
      ingredientId: ingredient.id,
      status: 'PENDING',
    });

    if (!existingAlert) {
      const alert = await StockAlert.create({
        ingredientId: ingredient.id,
        currentStock: ingredient.quantity,
        threshold: ingredient.lowStockThreshold,
      });
      return alert;
    }
  }

  return null;
};

/**
 * Get active (pending) alerts
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getActiveAlerts = async (filter, options) => {
  const alerts = await StockAlert.paginate(
    { ...filter, status: 'PENDING' },
    { ...options, populate: 'ingredientId acknowledgedBy', sortBy: 'triggeredAt:desc' }
  );
  return alerts;
};

/**
 * Get all alerts
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getAlerts = async (filter, options) => {
  const alerts = await StockAlert.paginate(filter, {
    ...options,
    populate: 'ingredientId acknowledgedBy',
    sortBy: 'triggeredAt:desc',
  });
  return alerts;
};

/**
 * Get alert by id
 * @param {ObjectId} id
 * @returns {Promise<StockAlert>}
 */
const getAlertById = async (id) => {
  return StockAlert.findById(id).populate('ingredientId acknowledgedBy');
};

/**
 * Acknowledge an alert
 * @param {ObjectId} alertId
 * @param {ObjectId} userId
 * @returns {Promise<StockAlert>}
 */
const acknowledgeAlert = async (alertId, userId) => {
  const alert = await StockAlert.findById(alertId);
  
  if (!alert) {
    throw new Error('Alert not found');
  }

  if (alert.status === 'ACKNOWLEDGED') {
    throw new Error('Alert already acknowledged');
  }

  alert.status = 'ACKNOWLEDGED';
  alert.acknowledgedBy = userId;
  alert.acknowledgedAt = new Date();
  await alert.save();

  return alert;
};

/**
 * Acknowledge multiple alerts
 * @param {Array<ObjectId>} alertIds
 * @param {ObjectId} userId
 * @returns {Promise<Number>}
 */
const acknowledgeMultipleAlerts = async (alertIds, userId) => {
  const result = await StockAlert.updateMany(
    { _id: { $in: alertIds }, status: 'PENDING' },
    {
      $set: {
        status: 'ACKNOWLEDGED',
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
      },
    }
  );

  return result.modifiedCount;
};

/**
 * Get count of pending alerts
 * @returns {Promise<Number>}
 */
const getPendingAlertsCount = async () => {
  return StockAlert.countDocuments({ status: 'PENDING' });
};

module.exports = {
  checkAndCreateAlerts,
  checkIngredientStock,
  getActiveAlerts,
  getAlerts,
  getAlertById,
  acknowledgeAlert,
  acknowledgeMultipleAlerts,
  getPendingAlertsCount,
};
