const mongoose = require('mongoose');

const TeamMemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  splitPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  fixedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['member', 'manager'],
    default: 'member'
  }
}, {
  timestamps: true
});

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 100,
    trim: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  defaultSplitType: {
    type: String,
    enum: ['equal', 'percentage', 'fixed'],
    default: 'equal'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  members: [TeamMemberSchema]
}, {
  timestamps: true
});

// Indexes
TeamSchema.index({ createdBy: 1 });
TeamSchema.index({ name: 1 });
TeamSchema.index({ 'members.userId': 1 });

// Team Instance Methods
TeamSchema.methods.getActiveMembers = async function() {
  await this.populate('members.userId', 'name email walletAddress');
  return this.members.filter(m => m.isActive);
};

TeamSchema.methods.calculateSplits = async function(totalAmount) {
  await this.populate('members.userId', 'name email walletAddress');
  const activeMembers = this.members.filter(m => m.isActive);
  
  if (activeMembers.length === 0) {
    throw new Error('No active team members');
  }

  let splits;
  switch (this.defaultSplitType) {
    case 'equal':
      const equalAmount = totalAmount / activeMembers.length;
      splits = activeMembers.map(member => ({
        userId: member.userId._id || member.userId,
        walletAddress: member.userId.walletAddress,
        amount: parseFloat(equalAmount.toFixed(2)),
        percentage: parseFloat((100 / activeMembers.length).toFixed(2))
      }));
      break;

    case 'percentage':
      const totalPercentage = activeMembers.reduce((sum, m) => sum + parseFloat(m.splitPercentage), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new Error(`Total split percentage must equal 100%, got ${totalPercentage}%`);
      }
      splits = activeMembers.map(member => ({
        userId: member.userId._id || member.userId,
        walletAddress: member.userId.walletAddress,
        amount: parseFloat((totalAmount * (member.splitPercentage / 100)).toFixed(2)),
        percentage: parseFloat(member.splitPercentage)
      }));
      break;

    case 'fixed':
      const totalFixed = activeMembers.reduce((sum, m) => sum + parseFloat(m.fixedAmount), 0);
      if (Math.abs(totalFixed - totalAmount) > 0.01) {
        throw new Error(`Total fixed amounts must equal payment amount, got ${totalFixed} but expected ${totalAmount}`);
      }
      splits = activeMembers.map(member => ({
        userId: member.userId._id || member.userId,
        walletAddress: member.userId.walletAddress,
        amount: parseFloat(member.fixedAmount),
        percentage: parseFloat(((member.fixedAmount / totalAmount) * 100).toFixed(2))
      }));
      break;

    default:
      throw new Error('Invalid split type');
  }

  return splits;
};

TeamSchema.methods.addMember = async function(userId, options = {}) {
  const { splitPercentage = 0, fixedAmount = 0, role = 'member' } = options;
  
  this.members.push({
    userId,
    splitPercentage,
    fixedAmount,
    role,
    isActive: true
  });
  
  return await this.save();
};

// Team Static Methods
TeamSchema.statics.getUserTeams = async function(userId) {
  return await this.find({
    'members.userId': userId
  }).populate('members.userId', 'name email walletAddress');
};

TeamSchema.statics.findByUserAndId = async function(userId, teamId) {
  return await this.findOne({
    _id: teamId,
    'members.userId': userId
  }).populate('members.userId', 'name email walletAddress');
};

module.exports = mongoose.model('Team', TeamSchema);