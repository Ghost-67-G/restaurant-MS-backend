const mongoose = require('mongoose');
const { toJSON, paginate, organizationGuard } = require('./plugins');

const inventorySchema = mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
      index: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
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
    allowNegativeStock: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
inventorySchema.plugin(toJSON);
inventorySchema.plugin(paginate);
inventorySchema.plugin(organizationGuard);

inventorySchema.index({ organizationId: 1, itemId: 1 }, { unique: true });
inventorySchema.index({ organizationId: 1, createdAt: -1 });
inventorySchema.index({ organizationId: 1, warehouseId: 1 });
inventorySchema.index({ organizationId: 1, warehouseId: 1, itemId: 1 });

/**
 * @typedef Inventory
 */
const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;
