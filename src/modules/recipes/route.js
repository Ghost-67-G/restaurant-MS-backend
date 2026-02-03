const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const recipeValidation = require('./validation');
const recipeController = require('./controller');
const { PERMISSIONS } = require('../../config/permissions');

const router = express.Router();

router
  .route('/')
  .post(auth(PERMISSIONS.MENU.MANAGE), validate(recipeValidation.createRecipe), recipeController.createRecipe);

router
  .route('/menu-item/:menuItemId')
  .get(auth(PERMISSIONS.MENU.VIEW), validate(recipeValidation.getRecipesByMenuItem), recipeController.getRecipesByMenuItem)
  .put(auth(PERMISSIONS.MENU.MANAGE), validate(recipeValidation.updateMenuItemRecipes), recipeController.updateMenuItemRecipes);

router
  .route('/ingredient/:ingredientId')
  .get(auth(PERMISSIONS.INVENTORY.VIEW), validate(recipeValidation.getRecipesByIngredient), recipeController.getRecipesByIngredient);

router
  .route('/:recipeId')
  .patch(auth(PERMISSIONS.MENU.MANAGE), validate(recipeValidation.updateRecipe), recipeController.updateRecipe)
  .delete(auth(PERMISSIONS.MENU.MANAGE), validate(recipeValidation.deleteRecipe), recipeController.deleteRecipe);

module.exports = router;
