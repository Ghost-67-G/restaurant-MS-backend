const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { ORDER_STATUS, ORDER_TYPE } = require('../config/constants');

const orderItemSchema = mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
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
  selectedModifiers: {
    type: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
          default: 0,
        },
      },
    ],
    default: [],
  },
  itemNote: {
    type: String,
    trim: true,
  },
});

const orderSchema = mongoose.Schema(
  {
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
    orderType: {
      type: String,
      enum: Object.values(ORDER_TYPE),
      required: true,
    },
    tableNumber: {
      type: String,
      trim: true,
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

/**
 * @typedef Order
 */
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
