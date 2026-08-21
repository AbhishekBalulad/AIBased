const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatConversation',
      required: true
    },
    sender: {
      type: String,
      enum: ['USER', 'AI_ASSISTANT'],
      required: true
    },
    messageText: {
      type: String,
      required: true
    },
    referencedSchemeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GovtScheme',
      required: false
    },
    citations: [
      {
        title: String,
        url: String
      }
    ],
    language: {
      type: String,
      default: 'en'
    }
  },
  {
    timestamps: true
  }
);

ChatMessageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
