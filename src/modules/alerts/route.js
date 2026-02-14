const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const alertValidation = require('./validation');
const alertController = require('./controller');
const { PERMISSIONS } = require('../../config/permissions');

const router = express.Router();

// Check and create alerts (typically run as a cron job or after inventory updates)
router.post('/check', auth(PERMISSIONS.INVENTORY.MANAGE), alertController.checkAndCreateAlerts);

// Get count of pending alerts
router.get('/pending/count', auth(PERMISSIONS.INVENTORY.VIEW), alertController.getPendingCount);

// Get all active/pending alerts
router.get(
  '/active',
  auth(PERMISSIONS.INVENTORY.VIEW),
  validate(alertValidation.getActiveAlerts),
  alertController.getActiveAlerts
);

// Acknowledge multiple alerts
router.post(
  '/acknowledge-multiple',
  auth(PERMISSIONS.INVENTORY.MANAGE),
  validate(alertValidation.acknowledgeMultipleAlerts),
  alertController.acknowledgeMultipleAlerts
);

// Get all alerts with filtering
router.get('/', auth(PERMISSIONS.INVENTORY.VIEW), validate(alertValidation.getAlerts), alertController.getAlerts);

// Get single alert
router.get('/:alertId', auth(PERMISSIONS.INVENTORY.VIEW), validate(alertValidation.getAlert), alertController.getAlert);

// Acknowledge single alert
router.patch(
  '/:alertId/acknowledge',
  auth(PERMISSIONS.INVENTORY.MANAGE),
  validate(alertValidation.acknowledgeAlert),
  alertController.acknowledgeAlert
);

module.exports = router;
