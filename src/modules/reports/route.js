const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const reportsValidation = require('./validation');
const reportsController = require('./controller');
const { PERMISSIONS } = require('../../config/permissions');

const router = express.Router();

router
  .route('/summary')
  .get(auth(PERMISSIONS.REPORTS.VIEW), validate(reportsValidation.getSummary), reportsController.getSummary);

module.exports = router;
