const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const taxSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
taxSchema.plugin(toJSON);
taxSchema.plugin(paginate);

/**
 * @typedef Tax
 */
const Tax = mongoose.model('Tax', taxSchema);

module.exports = Tax;
