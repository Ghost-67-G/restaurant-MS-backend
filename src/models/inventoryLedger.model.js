const mongoose = require('mongoose');
const { toJSON, paginate, organizationGuard } = require('./plugins');

const inventoryLedgerSchema = mongoose.Schema(
  {
    organizationId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    inventoryId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Inventory',
      required: true,
      index: true,
    },
    itemId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Item',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['IN', 'OUT', 'ADJUSTMENT'],
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    referenceType: {
      type: String,
      required: true,
      enum: ['ORDER', 'PURCHASE', 'REFUND', 'MANUAL'],
    },
    referenceId: {
      type: mongoose.SchemaTypes.ObjectId,
      index: true,
    },
    createdBy: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add plugins
inventoryLedgerSchema.plugin(toJSON);
inventoryLedgerSchema.plugin(paginate);
inventoryLedgerSchema.plugin(organizationGuard);

// Compound index for efficient queries
inventoryLedgerSchema.index({ organizationId: 1, inventoryId: 1, createdAt: -1 });
inventoryLedgerSchema.index({ organizationId: 1, itemId: 1, createdAt: -1 });
inventoryLedgerSchema.index({ referenceType: 1, referenceId: 1 });

/**
 * @typedef InventoryLedger
 */
const InventoryLedger = mongoose.model('InventoryLedger', inventoryLedgerSchema);

module.exports = InventoryLedger;
