const mongoose = require('mongoose');

const AiCacheSchema = new mongoose.Schema(
  {
    cacheKey: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    taskType: {
      type: String,
      enum: ['POLICY_SIMPLIFICATION', 'TRANSLATION', 'JOB_FRAUD_ANALYSIS', 'TTS_GENERATION'],
      required: true
    },
    inputHash: {
      type: String,
      required: true
    },
    cachedOutput: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    ttlExpiresAt: {
      type: Date,
      default: () => new Date(+new Date() + 7 * 24 * 60 * 60 * 1000) // 7 days default cache
    }
  },
  {
    timestamps: true
  }
);

AiCacheSchema.index({ cacheKey: 1 }, { unique: true });
AiCacheSchema.index({ ttlExpiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AiCache', AiCacheSchema);
