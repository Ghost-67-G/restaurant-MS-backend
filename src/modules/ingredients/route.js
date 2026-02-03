const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const ingredientValidation = require('./validation');
const ingredientController = require('./controller');
const { PERMISSIONS } = require('../../config/permissions');

const router = express.Router();

router
  .route('/')
  .post(auth(PERMISSIONS.INVENTORY.MANAGE), validate(ingredientValidation.createIngredient), ingredientController.createIngredient)
  .get(auth(PERMISSIONS.INVENTORY.VIEW), validate(ingredientValidation.getIngredients), ingredientController.getIngredients);

router
  .route('/low-stock')
  .get(auth(PERMISSIONS.INVENTORY.VIEW), ingredientController.getLowStock);

router
  .route('/:ingredientId')
  .get(auth(PERMISSIONS.INVENTORY.VIEW), validate(ingredientValidation.getIngredient), ingredientController.getIngredient)
  .patch(auth(PERMISSIONS.INVENTORY.MANAGE), validate(ingredientValidation.updateIngredient), ingredientController.updateIngredient)
  .delete(auth(PERMISSIONS.INVENTORY.MANAGE), validate(ingredientValidation.deleteIngredient), ingredientController.deleteIngredient);

router
  .route('/:ingredientId/stock')
  .patch(auth(PERMISSIONS.INVENTORY.MANAGE), validate(ingredientValidation.updateStock), ingredientController.updateStock);

module.exports = router;
