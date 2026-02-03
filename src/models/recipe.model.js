const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const recipeSchema = mongoose.Schema(
  {
    menuItemId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'MenuItem',
      required: true,
    },
    ingredientId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Ingredient',
      required: true,
    },
    quantityUsed: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Add plugin
recipeSchema.plugin(toJSON);

// Index for faster queries
recipeSchema.index({ menuItemId: 1 });
recipeSchema.index({ ingredientId: 1 });

/**
 * @typedef Recipe
 */
const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;
