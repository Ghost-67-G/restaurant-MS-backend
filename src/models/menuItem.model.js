const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const menuItemSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
    //   required: true,
      ref: 'Category',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    modifiers: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        price: {
          type: Number,
          required: true,
          default: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
menuItemSchema.plugin(toJSON);
menuItemSchema.plugin(paginate);

/**
 * @typedef MenuItem
 */
const MenuItem = mongoose.model('MenuItem', menuItemSchema);

module.exports = MenuItem;
