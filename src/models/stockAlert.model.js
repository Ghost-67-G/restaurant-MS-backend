const mongoose = require('mongoose');
const { toJSON, paginate, organizationGuard } = require('./plugins');

const stockAlertSchema = mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    currentStock: {
      type: Number,
      required: true,
    },
    threshold: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACKNOWLEDGED'],
      default: 'PENDING',
    },
    triggeredAt: {
      type: Date,
      default: Date.now,
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    acknowledgedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
stockAlertSchema.index({ organizationId: 1, inventoryId: 1, status: 1 });
stockAlertSchema.index({ status: 1, triggeredAt: -1 });

// add plugin that converts mongoose to json
stockAlertSchema.plugin(toJSON);
stockAlertSchema.plugin(paginate);
stockAlertSchema.plugin(organizationGuard);

/**
 * @typedef StockAlert
 */
const StockAlert = mongoose.model('StockAlert', stockAlertSchema);

module.exports = StockAlert;
