const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const stockAlertSchema = mongoose.Schema(
  {
    ingredientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
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
stockAlertSchema.index({ ingredientId: 1, status: 1 });
stockAlertSchema.index({ status: 1, triggeredAt: -1 });

// add plugin that converts mongoose to json
stockAlertSchema.plugin(toJSON);
stockAlertSchema.plugin(paginate);

/**
 * @typedef StockAlert
 */
const StockAlert = mongoose.model('StockAlert', stockAlertSchema);

module.exports = StockAlert;
