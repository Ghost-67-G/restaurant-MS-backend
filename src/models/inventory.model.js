const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const inventorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
inventorySchema.plugin(toJSON);
inventorySchema.plugin(paginate);

/**
 * @typedef Inventory
 */
const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;
