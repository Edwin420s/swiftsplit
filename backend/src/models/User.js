const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: false,
    minlength: 6
  },
  authMethod: {
    type: String,
    enum: ['email', 'wallet'],
    default: 'email'
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
    lowercase: true,
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

// Hash password before saving (only for email auth)
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Validate wallet or email auth requirements
UserSchema.pre('save', function(next) {
  if (this.authMethod === 'wallet' && !this.walletAddress) {
    return next(new Error('Wallet address required for wallet authentication'));
  }
  if (this.authMethod === 'email' && (!this.email || !this.password)) {
    return next(new Error('Email and password required for email authentication'));
  }
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