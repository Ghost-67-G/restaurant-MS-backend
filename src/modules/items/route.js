const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const itemValidation = require('./validation');
const itemController = require('./controller');
const { PERMISSIONS } = require('../../config/permissions');

const router = express.Router();

router
  .route('/')
  .post(auth(PERMISSIONS.ITEM.MANAGE), validate(itemValidation.createItem), itemController.createItem)
  .get(auth(PERMISSIONS.ITEM.VIEW), validate(itemValidation.getItems), itemController.getItems);

router
  .route('/:itemId')
  .get(auth(PERMISSIONS.ITEM.VIEW), validate(itemValidation.getItem), itemController.getItem)
  .patch(auth(PERMISSIONS.ITEM.MANAGE), validate(itemValidation.updateItem), itemController.updateItem)
  .delete(auth(PERMISSIONS.ITEM.MANAGE), validate(itemValidation.deleteItem), itemController.deleteItem);

module.exports = router;
