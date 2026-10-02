const mongoose = require('mongoose');
const { toJSON, paginate, organizationGuard } = require('./plugins');

const orderAdjustmentSchema = mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['REFUND', 'VOID'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add plugins
orderAdjustmentSchema.plugin(toJSON);
orderAdjustmentSchema.plugin(paginate);
orderAdjustmentSchema.plugin(organizationGuard);

// Indexes for common queries
orderAdjustmentSchema.index({ orderId: 1, createdAt: -1 });
orderAdjustmentSchema.index({ organizationId: 1, createdAt: -1 });
orderAdjustmentSchema.index({ type: 1 });
orderAdjustmentSchema.index({ createdBy: 1 });

/**
 * @typedef OrderAdjustment
 */
const OrderAdjustment = mongoose.model('OrderAdjustment', orderAdjustmentSchema);

module.exports = OrderAdjustment;
