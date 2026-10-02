const { StockAlert, Inventory } = require('../models');
const { validateOrganizationId, buildOrganizationFilter, safeFindOne } = require('../utils/organizationGuard');

/**
 * Check all inventory records and create alerts for low stock
 * @returns {Promise<Array>}
 */
const checkAndCreateAlerts = async (organizationId) => {
  validateOrganizationId(organizationId);
  const inventoryRecords = await Inventory.find(buildOrganizationFilter(organizationId)).populate('itemId');

  const alertPromises = inventoryRecords
    .filter((inventory) => inventory.quantity <= inventory.lowStockThreshold)
    .map(async (inventory) => {
      const existingAlert = await StockAlert.findOne({
        organizationId,
        inventoryId: inventory.id,
        status: 'PENDING',
      });

      if (!existingAlert) {
        const alert = await StockAlert.create({
          organizationId,
          inventoryId: inventory.id,
          itemId: inventory.itemId.id,
          currentStock: inventory.quantity,
          threshold: inventory.lowStockThreshold,
        });
        return alert;
      }
      return null;
    });

  const results = await Promise.all(alertPromises);
  return results.filter((alert) => alert !== null);
};

/**
 * Check single inventory record and create alert if needed
 * @param {ObjectId} inventoryId
 * @returns {Promise<StockAlert|null>}
 */
const checkInventoryStock = async (organizationId, inventoryId) => {
  validateOrganizationId(organizationId);
  const inventory = await safeFindOne(Inventory, organizationId, { _id: inventoryId }).populate('itemId');

  if (!inventory) {
    return null;
  }

  if (inventory.quantity <= inventory.lowStockThreshold) {
    const existingAlert = await StockAlert.findOne({
      organizationId,
      inventoryId: inventory.id,
      status: 'PENDING',
    });

    if (!existingAlert) {
      const alert = await StockAlert.create({
        organizationId,
        inventoryId: inventory.id,
        itemId: inventory.itemId.id,
        currentStock: inventory.quantity,
        threshold: inventory.lowStockThreshold,
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
const getActiveAlerts = async (organizationId, filter, options) => {
  validateOrganizationId(organizationId);
  const alerts = await StockAlert.paginate(buildOrganizationFilter(organizationId, { ...filter, status: 'PENDING' }), {
    ...options,
    populate: 'inventoryId itemId acknowledgedBy',
    sortBy: 'triggeredAt:desc',
  });
  return alerts;
};

/**
 * Get all alerts
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getAlerts = async (organizationId, filter, options) => {
  validateOrganizationId(organizationId);
  const alerts = await StockAlert.paginate(buildOrganizationFilter(organizationId, filter), {
    ...options,
    populate: 'inventoryId itemId acknowledgedBy',
    sortBy: 'triggeredAt:desc',
  });
  return alerts;
};

/**
 * Get alert by id
 * @param {ObjectId} id
 * @returns {Promise<StockAlert>}
 */
const getAlertById = async (organizationId, id) => {
  validateOrganizationId(organizationId);
  return safeFindOne(StockAlert, organizationId, { _id: id }).populate('inventoryId itemId acknowledgedBy');
};

/**
 * Acknowledge an alert
 * @param {ObjectId} alertId
 * @param {ObjectId} userId
 * @returns {Promise<StockAlert>}
 */
const acknowledgeAlert = async (organizationId, alertId, userId) => {
  validateOrganizationId(organizationId);
  const alert = await safeFindOne(StockAlert, organizationId, { _id: alertId });

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
const acknowledgeMultipleAlerts = async (organizationId, alertIds, userId) => {
  validateOrganizationId(organizationId);
  const result = await StockAlert.updateMany(
    buildOrganizationFilter(organizationId, { _id: { $in: alertIds }, status: 'PENDING' }),
    {
      $set: {
        status: 'ACKNOWLEDGED',
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
      },
    }
  );

  return result.modifiedCount || result.nModified || 0;
};

/**
 * Get count of pending alerts
 * @returns {Promise<Number>}
 */
const getPendingAlertsCount = async (organizationId) => {
  validateOrganizationId(organizationId);
  return StockAlert.countDocuments(buildOrganizationFilter(organizationId, { status: 'PENDING' }));
};

module.exports = {
  checkAndCreateAlerts,
  checkInventoryStock,
  getActiveAlerts,
  getAlerts,
  getAlertById,
  acknowledgeAlert,
  acknowledgeMultipleAlerts,
  getPendingAlertsCount,
};
