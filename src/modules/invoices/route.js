const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const invoiceValidation = require('./validation');
const invoiceController = require('./controller');
const { PERMISSIONS } = require('../../config/permissions');

const router = express.Router();

router
  .route('/')
  .post(auth(PERMISSIONS.ORDER.VIEW), validate(invoiceValidation.createInvoice), invoiceController.createInvoice)
  .get(auth(PERMISSIONS.ORDER.VIEW), validate(invoiceValidation.getInvoices), invoiceController.getInvoices);

router
  .route('/:invoiceId')
  .get(auth(PERMISSIONS.ORDER.VIEW), validate(invoiceValidation.getInvoice), invoiceController.getInvoice);

router
  .route('/number/:invoiceNumber')
  .get(auth(PERMISSIONS.ORDER.VIEW), validate(invoiceValidation.getInvoiceByNumber), invoiceController.getInvoiceByNumber);

router.route('/order/:orderId').get(auth(PERMISSIONS.ORDER.VIEW), invoiceController.getOrderInvoice);

module.exports = router;
