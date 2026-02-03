const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const ingredientSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    unit: {
      type: String,
      required: true,
      enum: ['kg', 'g', 'ltr', 'ml', 'pcs'],
      default: 'pcs',
    },
    currentStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      required: true,
      default: 10,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add plugins
ingredientSchema.plugin(toJSON);
ingredientSchema.plugin(paginate);

// Virtual for low stock alert
ingredientSchema.virtual('isLowStock').get(function () {
  return this.currentStock <= this.lowStockThreshold;
});

/**
 * @typedef Ingredient
 */
const Ingredient = mongoose.model('Ingredient', ingredientSchema);

module.exports = Ingredient;
