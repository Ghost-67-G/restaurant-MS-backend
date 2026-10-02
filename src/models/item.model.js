const mongoose = require('mongoose');
const { toJSON, paginate, organizationGuard } = require('./plugins');

const itemOptionSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    priceAdjustment: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { _id: false }
);

const itemSchema = mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
    },
    barcode: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    unit: {
      type: String,
      trim: true,
      default: 'pcs',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    costPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    isSellable: {
      type: Boolean,
      default: true,
    },
    trackStock: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    options: {
      type: [itemOptionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

itemSchema.plugin(toJSON);
itemSchema.plugin(paginate);
itemSchema.plugin(organizationGuard);

itemSchema.index({ organizationId: 1, name: 1 }, { unique: true });
itemSchema.index({ organizationId: 1, createdAt: -1 });
itemSchema.index(
  { organizationId: 1, sku: 1 },
  { unique: true, sparse: true, partialFilterExpression: { sku: { $type: 'string' } } }
);

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
