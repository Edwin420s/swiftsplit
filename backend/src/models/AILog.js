const mongoose = require('mongoose');

const AILogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: false
  },
  inputType: {
    type: String,
    enum: ['invoice', 'chat', 'voice'],
    required: true
  },
  inputData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  parsedOutput: {
    payer: String,
    recipients: [String],
    amounts: [Number],
    currency: String,
    purpose: String
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  status: {
    type: String,
    enum: ['parsed', 'verified', 'rejected'],
    default: 'parsed'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AILog', AILogSchema);