const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const wasteValidation = require('./validation');
const wasteController = require('./controller');
const { PERMISSIONS } = require('../../config/permissions');

const router = express.Router();

// Get waste statistics
router.get('/stats', auth(PERMISSIONS.INVENTORY.VIEW), validate(wasteValidation.getWasteStats), wasteController.getWasteStats);

// Record waste
router.post('/', auth(PERMISSIONS.INVENTORY.MANAGE), validate(wasteValidation.recordWaste), wasteController.recordWaste);

// Get all waste entries
router.get('/', auth(PERMISSIONS.INVENTORY.VIEW), validate(wasteValidation.getAllWaste), wasteController.getAllWaste);

// Get waste entries for a specific ingredient
router.get(
  '/ingredient/:ingredientId',
  auth(PERMISSIONS.INVENTORY.VIEW),
  validate(wasteValidation.getWasteByIngredient),
  wasteController.getWasteByIngredient
);

module.exports = router;
