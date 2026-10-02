const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const organizationSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ['free', 'starter', 'pro'],
      default: 'free',
      trim: true,
    },
    limits: {
      maxUsers: {
        type: Number,
        default: 5,
        min: 1,
      },
      maxItems: {
        type: Number,
        default: 100,
        min: 1,
      },
      maxWarehouses: {
        type: Number,
        default: 1,
        min: 1,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

organizationSchema.plugin(toJSON);
organizationSchema.plugin(paginate);

organizationSchema.index({ name: 1 });
organizationSchema.index({ isActive: 1, createdAt: -1 });

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;
