const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['client', 'freelancer', 'team_manager'],
    default: 'freelancer'
  },
  walletAddress: {
    type: String,
    unique: true,
    sparse: true,
    match: /^0x[a-fA-F0-9]{40}$/
  },
  circleUserId: {
    type: String,
    unique: true,
    sparse: true
  },
  walletId: {
    type: String,
    unique: true,
    sparse: true
  },
  kycStatus: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance methods
UserSchema.methods.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

UserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Static methods
UserSchema.statics.findByEmail = async function(email) {
  return await this.findOne({ email });
};

UserSchema.statics.findByWalletAddress = async function(walletAddress) {
  return await this.findOne({ walletAddress });
};

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ walletAddress: 1 });
UserSchema.index({ circleUserId: 1 });

module.exports = mongoose.model('User', UserSchema);