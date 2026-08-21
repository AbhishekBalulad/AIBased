const mongoose = require('mongoose');

const ChatConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      default: 'Government Policy Assistant Chat'
    },
    lastMessage: {
      type: String,
      default: ''
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  {
    timestamps: true
  }
);

ChatConversationSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('ChatConversation', ChatConversationSchema);
