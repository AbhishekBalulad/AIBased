const mongoose = require('mongoose');

const SchemeSourceSchema = new mongoose.Schema(
  {
    sourceName: {
      type: String,
      required: [true, 'Please provide source name'],
      trim: true
    },
    baseUrl: {
      type: String,
      required: [true, 'Please provide base URL of government source'],
      trim: true
    },
    apiEndpoint: {
      type: String,
      trim: true,
      default: ''
    },
    ministryOrDepartment: {
      type: String,
      trim: true,
      default: 'Government of India'
    },
    lastSyncTimestamp: {
      type: Date,
      default: Date.now
    },
    syncStatus: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SYNCING', 'FAILED'],
      default: 'ACTIVE'
    },
    recordsFetched: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

SchemeSourceSchema.index({ sourceName: 1 });

module.exports = mongoose.model('SchemeSource', SchemeSourceSchema);
