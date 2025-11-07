const mongoose = require('mongoose');

const AILogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: false,
    index: true
  },
  inputType: {
    type: String,
    enum: ['invoice', 'chat', 'voice'],
    required: true,
    index: true
  },
  inputData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  rawText: {
    type: String,
    default: ''
  },
  parsedOutput: {
    payer: String,
    payerWallet: String,
    recipients: [{
      name: String,
      wallet: String
    }],
    amounts: [Number],
    currency: {
      type: String,
      default: 'USDC'
    },
    purpose: String,
    splits: [{
      recipient: String,
      wallet: String,
      amount: Number,
      percentage: Number
    }]
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.8
  },
  status: {
    type: String,
    enum: ['parsed', 'verified', 'rejected', 'processing'],
    default: 'parsed',
    index: true
  },
  verificationNotes: {
    type: String,
    default: ''
  },
  paymentId: {
    type: String,
    default: null,
    index: true
  },
  isMock: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
AILogSchema.index({ userId: 1, createdAt: -1 });
AILogSchema.index({ status: 1, createdAt: -1 });
AILogSchema.index({ paymentId: 1 });

module.exports = mongoose.model('AILog', AILogSchema);