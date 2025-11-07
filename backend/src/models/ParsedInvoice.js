const mongoose = require('mongoose');

const ParsedInvoiceSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  invoiceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  originalFileName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: false
  },
  ipfsHash: {
    type: String,
    default: null
  },
  parsedData: {
    invoiceNumber: String,
    issueDate: Date,
    dueDate: Date,
    payer: {
      name: String,
      wallet: String,
      email: String
    },
    recipients: [{
      name: String,
      wallet: String,
      amount: Number,
      description: String
    }],
    totalAmount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USDC'
    },
    items: [{
      description: String,
      quantity: Number,
      unitPrice: Number,
      totalPrice: Number
    }],
    notes: String,
    taxAmount: Number,
    discountAmount: Number
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'partial'],
    default: 'pending',
    index: true
  },
  aiConfidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.8
  },
  aiLogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AILog',
    required: true
  },
  paymentId: {
    type: String,
    default: null,
    index: true
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'pending', 'paid', 'partially_paid', 'failed'],
    default: 'unpaid',
    index: true
  },
  metadata: {
    mimeType: String,
    fileSize: Number,
    processedAt: Date,
    ocrEngine: String,
    nlpModel: String
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
ParsedInvoiceSchema.index({ userId: 1, createdAt: -1 });
ParsedInvoiceSchema.index({ verificationStatus: 1, paymentStatus: 1 });
ParsedInvoiceSchema.index({ paymentId: 1 });

module.exports = mongoose.model('ParsedInvoice', ParsedInvoiceSchema);
