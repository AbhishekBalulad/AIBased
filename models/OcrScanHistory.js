const mongoose = require('mongoose');

const OcrScanHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    documentTypeDetected: {
      type: String,
      default: 'General Document'
    },
    extractedText: {
      type: String,
      required: true
    },
    matchedSchemes: [
      {
        schemeId: { type: mongoose.Schema.Types.ObjectId, ref: 'GovtScheme' },
        matchConfidence: Number,
        eligibilityReason: String
      }
    ],
    scanStatus: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'PARTIAL'],
      default: 'SUCCESS'
    }
  },
  {
    timestamps: true
  }
);

OcrScanHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('OcrScanHistory', OcrScanHistorySchema);
