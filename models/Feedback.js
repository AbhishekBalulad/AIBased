const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    feedbackType: {
      type: String,
      enum: ['SCHEME_SIMPLIFICATION', 'AI_CHATBOT', 'TRANSLATION_QUALITY', 'JOB_PORTAL', 'GENERAL_APP'],
      required: true
    },
    targetRefId: {
      type: String,
      default: ''
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Please provide a rating between 1 and 5']
    },
    comment: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

FeedbackSchema.index({ userId: 1, feedbackType: 1 });

module.exports = mongoose.model('Feedback', FeedbackSchema);
