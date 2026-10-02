const mongoose = require('mongoose');
const { toJSON, paginate, organizationGuard } = require('./plugins');

const taxSchema = mongoose.Schema(
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
taxSchema.plugin(organizationGuard);

taxSchema.index({ organizationId: 1, name: 1 }, { unique: true });

/**
 * @typedef Tax
 */
const Tax = mongoose.model('Tax', taxSchema);

module.exports = Tax;
