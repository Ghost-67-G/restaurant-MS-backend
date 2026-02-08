const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const invoiceSchema = mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    snapshot: {
      // Complete snapshot of order at time of invoice creation
      // Never regenerated - immutable historical record
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    printedAt: {
      type: Date,
      default: Date.now,
    },
    printedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Add plugins
invoiceSchema.plugin(toJSON);
invoiceSchema.plugin(paginate);

// Indexes for queries
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ orderId: 1 });
invoiceSchema.index({ createdAt: -1 });

/**
 * @typedef Invoice
 */
const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
