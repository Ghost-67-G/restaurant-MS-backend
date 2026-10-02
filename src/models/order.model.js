const mongoose = require('mongoose');
const { toJSON, paginate, organizationGuard } = require('./plugins');
const { ORDER_STATUS, PAYMENT_METHOD } = require('../config/constants');

const orderItemSchema = mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
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
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  selectedOptions: {
    type: [
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
    ],
    default: [],
  },
  discountAmount: {
    type: Number,
    min: 0,
    default: 0,
  },
  lineTotal: {
    type: Number,
    required: true,
    min: 0,
  },
  note: {
    type: String,
    trim: true,
  },
});

const orderSchema = mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator(v) {
          return v && v.length > 0;
        },
        message: 'Order must contain at least one item',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discountType: {
      type: String,
      enum: ['PERCENT', 'FLAT'],
    },
    discountValue: {
      type: Number,
      min: 0,
    },
    discountAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    taxName: {
      type: String,
      trim: true,
    },
    taxPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    taxAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isVoided: {
      type: Boolean,
      default: false,
    },
    isRefunded: {
      type: Boolean,
      default: false,
    },
    refundedAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
orderSchema.plugin(toJSON);
orderSchema.plugin(paginate);
orderSchema.plugin(organizationGuard);

orderSchema.index({ organizationId: 1, createdAt: -1 });
orderSchema.index({ organizationId: 1, status: 1, createdAt: -1 });

/**
 * @typedef Order
 */
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
