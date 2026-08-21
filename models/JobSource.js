const mongoose = require('mongoose');

const JobSourceSchema = new mongoose.Schema(
  {
    providerName: {
      type: String,
      required: [true, 'Please provide provider name'],
      trim: true
    },
    sourceType: {
      type: String,
      enum: ['GOVT_PORTAL', 'PUBLIC_FEED', 'VERIFIED_API'],
      default: 'VERIFIED_API'
    },
    apiEndpointUrl: {
      type: String,
      required: true,
      trim: true
    },
    isPermittedSource: {
      type: Boolean,
      default: true
    },
    lastIngestedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

JobSourceSchema.index({ providerName: 1 });

module.exports = mongoose.model('JobSource', JobSourceSchema);
