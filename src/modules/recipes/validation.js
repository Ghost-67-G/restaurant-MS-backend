const Joi = require('joi');
const { objectId } = require('../../validations/custom.validation');

const createRecipe = {
  body: Joi.object().keys({
    menuItemId: Joi.string().custom(objectId).required(),
    ingredientId: Joi.string().custom(objectId).required(),
    quantityUsed: Joi.number().min(0).required(),
  }),
};

const getRecipesByMenuItem = {
  params: Joi.object().keys({
    menuItemId: Joi.string().custom(objectId),
  }),
};

const getRecipesByIngredient = {
  params: Joi.object().keys({
    ingredientId: Joi.string().custom(objectId),
  }),
};

const updateRecipe = {
  params: Joi.object().keys({
    recipeId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      ingredientId: Joi.string().custom(objectId),
      quantityUsed: Joi.number().min(0),
    })
    .min(1),
};

const deleteRecipe = {
  params: Joi.object().keys({
    recipeId: Joi.string().custom(objectId),
  }),
};

const updateMenuItemRecipes = {
  params: Joi.object().keys({
    menuItemId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    recipes: Joi.array()
      .items(
        Joi.object().keys({
          ingredientId: Joi.string().custom(objectId).required(),
          quantityUsed: Joi.number().min(0).required(),
        })
      )
      .required(),
  }),
};

module.exports = {
  createRecipe,
  getRecipesByMenuItem,
  getRecipesByIngredient,
  updateRecipe,
  deleteRecipe,
  updateMenuItemRecipes,
};
