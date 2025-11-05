const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'USDC'
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled'),
    defaultValue: 'pending'
  },
  transactionHash: {
    type: DataTypes.STRING
  },
  recipientWallet: {
    type: DataTypes.STRING,
    allowNull: false
  },
  payerWallet: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  teamId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Teams',
      key: 'id'
    }
  },
  parentPaymentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Payments',
      key: 'id'
    }
  },
  aiLogId: {
    type: DataTypes.STRING, // MongoDB log ID
    allowNull: true
  }
}, {
  tableName: 'payments',
  timestamps: true,
  indexes: [
    {
      fields: ['payerWallet']
    },
    {
      fields: ['recipientWallet']
    },
    {
      fields: ['status']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// Associations
Payment.belongsTo(require('./Team'), { foreignKey: 'teamId', as: 'team' });
Payment.belongsTo(Payment, { foreignKey: 'parentPaymentId', as: 'parentPayment' });

// Instance methods
Payment.prototype.markAsCompleted = function(transactionHash) {
  return this.update({
    status: 'completed',
    transactionHash
  });
};

Payment.prototype.markAsFailed = function() {
  return this.update({
    status: 'failed'
  });
};

// Static methods
Payment.getUserPayments = async function(walletAddress, limit = 50) {
  return await this.findAll({
    where: {
      [DataTypes.Op.or]: [
        { payerWallet: walletAddress },
        { recipientWallet: walletAddress }
      ]
    },
    order: [['createdAt', 'DESC']],
    limit
  });
};

Payment.getTeamPayments = async function(teamId) {
  return await this.findAll({
    where: { teamId },
    order: [['createdAt', 'DESC']]
  });
};

module.exports = Payment;