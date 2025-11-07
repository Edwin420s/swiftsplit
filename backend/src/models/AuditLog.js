const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'payment_created',
      'payment_executed',
      'payment_failed',
      'payment_cancelled',
      'team_created',
      'team_updated',
      'team_member_added',
      'team_member_removed',
      'wallet_created',
      'user_registered',
      'user_login',
      'ai_verification',
      'split_calculated'
    ],
    index: true
  },
  entityType: {
    type: String,
    required: true,
    enum: ['payment', 'team', 'user', 'wallet', 'ai_log'],
    index: true
  },
  entityId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  walletAddress: {
    type: String,
    match: /^0x[a-fA-F0-9]{40}$/,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'pending'],
    default: 'success'
  }
}, {
  timestamps: true
});

// Indexes
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ walletAddress: 1 });

// Static method to create audit log
AuditLogSchema.statics.logAction = async function(data) {
  try {
    return await this.create({
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      userId: data.userId || null,
      walletAddress: data.walletAddress || null,
      description: data.description,
      metadata: data.metadata || {},
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      status: data.status || 'success'
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return null;
  }
};

// Static method to get user activity
AuditLogSchema.statics.getUserActivity = async function(userId, limit = 50) {
  return await this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get entity history
AuditLogSchema.statics.getEntityHistory = async function(entityType, entityId) {
  return await this.find({ entityType, entityId })
    .sort({ createdAt: 1 });
};

module.exports = mongoose.model('AuditLog', AuditLogSchema);
