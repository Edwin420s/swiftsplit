const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 100]
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  role: {
    type: DataTypes.ENUM('client', 'freelancer', 'team_manager'),
    allowNull: false,
    defaultValue: 'freelancer'
  },
  walletAddress: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true // Initially null until wallet is created
  },
  circleUserId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  walletId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  kycStatus: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  }
});

// Instance methods
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

// Static methods
User.findByEmail = async function(email) {
  return await this.findOne({ where: { email } });
};

User.findByWalletAddress = async function(walletAddress) {
  return await this.findOne({ where: { walletAddress } });
};

module.exports = User;