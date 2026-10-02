const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const ledgerValidation = require('./validation');
const ledgerController = require('./controller');
const { PERMISSIONS } = require('../../config/permissions');

const router = express.Router();

router
  .route('/')
  .get(auth(PERMISSIONS.INVENTORY.VIEW), validate(ledgerValidation.getLedgerEntries), ledgerController.getLedgerEntries);

router
  .route('/:ledgerId')
  .get(auth(PERMISSIONS.INVENTORY.VIEW), validate(ledgerValidation.getLedgerEntry), ledgerController.getLedgerEntry);

router
  .route('/inventory/:inventoryId')
  .get(
    auth(PERMISSIONS.INVENTORY.VIEW),
    validate(ledgerValidation.getLedgerByInventory),
    ledgerController.getLedgerByInventory
  );

router
  .route('/inventory/:inventoryId/stats')
  .get(auth(PERMISSIONS.INVENTORY.VIEW), validate(ledgerValidation.getLedgerStats), ledgerController.getLedgerStats);

module.exports = router;
