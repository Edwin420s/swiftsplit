const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  currency: {
    type: String,
    default: 'USDC',
    enum: ['USDC', 'USD']
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  transactionHash: {
    type: String,
    match: /^0x([A-Fa-f0-9]{64})$/,
    index: true
  },
  recipientWallet: {
    type: String,
    required: true,
    match: /^0x[a-fA-F0-9]{40}$/,
    index: true
  },
  payerWallet: {
    type: String,
    required: true,
    match: /^0x[a-fA-F0-9]{40}$/,
    index: true
  },
  description: {
    type: String,
    maxlength: 1000
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    index: true
  },
  parentPaymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  aiLogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AILog'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
PaymentSchema.index({ payerWallet: 1, createdAt: -1 });
PaymentSchema.index({ recipientWallet: 1, createdAt: -1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ teamId: 1 });
PaymentSchema.index({ transactionHash: 1 }, { unique: true, sparse: true });

// Instance Methods
PaymentSchema.methods.markAsCompleted = async function(transactionHash) {
  this.status = 'completed';
  this.transactionHash = transactionHash;
  return await this.save();
};

PaymentSchema.methods.markAsFailed = async function(errorMessage = null) {
  this.status = 'failed';
  if (errorMessage) {
    this.metadata = { ...this.metadata, error: errorMessage };
  }
  return await this.save();
};

PaymentSchema.methods.markAsProcessing = async function() {
  this.status = 'processing';
  return await this.save();
};

PaymentSchema.methods.isCompleted = function() {
  return this.status === 'completed';
};

PaymentSchema.methods.isFailed = function() {
  return this.status === 'failed';
};

PaymentSchema.methods.isPending = function() {
  return this.status === 'pending';
};

// Static Methods
PaymentSchema.statics.getUserPayments = async function(walletAddress, limit = 50, offset = 0) {
  return await this.find({
    $or: [
      { payerWallet: walletAddress },
      { recipientWallet: walletAddress }
    ]
  })
  .populate('teamId', 'name')
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(offset);
};

PaymentSchema.statics.getTeamPayments = async function(teamId, limit = 50) {
  return await this.find({ teamId })
  .populate('teamId', 'name')
  .sort({ createdAt: -1 })
  .limit(limit);
};

PaymentSchema.statics.getRecentPayments = async function(walletAddress, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await this.find({
    $or: [
      { payerWallet: walletAddress },
      { recipientWallet: walletAddress }
    ],
    createdAt: { $gte: startDate }
  }).sort({ createdAt: -1 });
};

PaymentSchema.statics.getStatsByPeriod = async function(walletAddress, period = 'month') {
  let dateFormat;
  
  switch (period) {
    case 'day':
      dateFormat = '%Y-%m-%d';
      break;
    case 'week':
      dateFormat = '%Y-W%V';
      break;
    case 'month':
    default:
      dateFormat = '%Y-%m';
      break;
  }

  return await this.aggregate([
    {
      $match: {
        payerWallet: walletAddress,
        status: 'completed'
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
        count: { $sum: 1 },
        total: { $sum: '$amount' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

module.exports = mongoose.model('Payment', PaymentSchema);