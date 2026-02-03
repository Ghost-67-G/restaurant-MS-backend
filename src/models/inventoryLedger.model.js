const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const inventoryLedgerSchema = mongoose.Schema(
  {
    ingredientId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Ingredient',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['IN', 'OUT', 'WASTE', 'ADJUSTMENT'],
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
      enum: ['ORDER', 'PURCHASE', 'WASTE', 'MANUAL'],
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

// Compound index for efficient queries
inventoryLedgerSchema.index({ ingredientId: 1, createdAt: -1 });
inventoryLedgerSchema.index({ referenceType: 1, referenceId: 1 });

/**
 * @typedef InventoryLedger
 */
const InventoryLedger = mongoose.model('InventoryLedger', inventoryLedgerSchema);

module.exports = InventoryLedger;
