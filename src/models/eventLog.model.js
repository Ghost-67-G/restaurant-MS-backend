const mongoose = require('mongoose');
const { toJSON, paginate, organizationGuard } = require('./plugins');

const eventLogSchema = mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    eventName: {
      type: String,
      required: true,
      index: true,
    },
    eventData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    error: {
      type: String,
    },
    processingStartedAt: {
      type: Date,
    },
    processingCompletedAt: {
      type: Date,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Add plugins
eventLogSchema.plugin(toJSON);
eventLogSchema.plugin(paginate);
eventLogSchema.plugin(organizationGuard);

// Add indexes for common queries
eventLogSchema.index({ eventName: 1, status: 1 });
eventLogSchema.index({ organizationId: 1, eventName: 1, createdAt: -1 });
eventLogSchema.index({ createdAt: -1 });

/**
 * @typedef EventLog
 */
const EventLog = mongoose.model('EventLog', eventLogSchema);

module.exports = EventLog;
