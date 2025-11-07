const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  userWallet: {
    type: String,
    required: false
  },
  role: {
    type: String,
    enum: ['user', 'ai_agent', 'system'],
    default: 'user'
  },
  message: {
    type: String,
    required: true
  },
  intent: {
    type: String,
    enum: ['payment_request', 'query', 'confirmation', 'general', 'unknown'],
    default: 'unknown'
  },
  parsedData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  aiLogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AILog',
    default: null
  },
  paymentId: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
ChatMessageSchema.index({ conversationId: 1, createdAt: 1 });
ChatMessageSchema.index({ userId: 1, createdAt: -1 });
ChatMessageSchema.index({ intent: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
