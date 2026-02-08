const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const adjustmentValidation = require('./validation');
const adjustmentController = require('./controller');
const { PERMISSIONS } = require('../../config/permissions');

const router = express.Router();

router
  .route('/')
  .post(
    auth(PERMISSIONS.ORDER.MANAGE),
    validate(adjustmentValidation.createAdjustment),
    adjustmentController.createAdjustment
  )
  .get(auth(PERMISSIONS.ORDER.VIEW), validate(adjustmentValidation.getAdjustments), adjustmentController.getAdjustments);

router
  .route('/:adjustmentId')
  .get(auth(PERMISSIONS.ORDER.VIEW), validate(adjustmentValidation.getAdjustment), adjustmentController.getAdjustment);

router.route('/order/:orderId').get(auth(PERMISSIONS.ORDER.VIEW), adjustmentController.getOrderAdjustments);

module.exports = router;
