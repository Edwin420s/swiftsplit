const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');

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
    defaultValue: 'USDC',
    validate: {
      isIn: [['USDC', 'USD']]
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled'),
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'processing', 'completed', 'failed', 'cancelled']]
    }
  },
  transactionHash: {
    type: DataTypes.STRING,
    validate: {
      is: /^0x([A-Fa-f0-9]{64})$/
    }
  },
  recipientWallet: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: /^0x[a-fA-F0-9]{40}$/
    }
  },
  payerWallet: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: /^0x[a-fA-F0-9]{40}$/
    }
  },
  description: {
    type: DataTypes.TEXT,
    validate: {
      len: [0, 1000]
    }
  },
  teamId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'teams',
      key: 'id'
    }
  },
  parentPaymentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'payments',
      key: 'id'
    }
  },
  aiLogId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
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
    },
    {
      fields: ['teamId']
    },
    {
      fields: ['transactionHash'],
      unique: true
    }
  ]
});

// Associations
const Team = require('./Team').Team;
Payment.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });
Payment.belongsTo(Payment, { foreignKey: 'parentPaymentId', as: 'parentPayment' });
Payment.hasMany(Payment, { foreignKey: 'parentPaymentId', as: 'childPayments' });

// Instance Methods
Payment.prototype.markAsCompleted = function(transactionHash) {
  return this.update({
    status: 'completed',
    transactionHash
  });
};

Payment.prototype.markAsFailed = function(errorMessage = null) {
  const updates = { status: 'failed' };
  if (errorMessage) {
    updates.metadata = { ...this.metadata, error: errorMessage };
  }
  return this.update(updates);
};

Payment.prototype.markAsProcessing = function() {
  return this.update({ status: 'processing' });
};

Payment.prototype.isCompleted = function() {
  return this.status === 'completed';
};

Payment.prototype.isFailed = function() {
  return this.status === 'failed';
};

Payment.prototype.isPending = function() {
  return this.status === 'pending';
};

// Static Methods
Payment.getUserPayments = async function(walletAddress, limit = 50, offset = 0) {
  return await this.findAll({
    where: {
      [Op.or]: [
        { payerWallet: walletAddress },
        { recipientWallet: walletAddress }
      ]
    },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    include: [
      {
        model: Team,
        as: 'team',
        attributes: ['id', 'name']
      }
    ]
  });
};

Payment.getTeamPayments = async function(teamId, limit = 50) {
  return await this.findAll({
    where: { teamId },
    order: [['createdAt', 'DESC']],
    limit,
    include: [
      {
        model: Team,
        as: 'team',
        attributes: ['id', 'name']
      }
    ]
  });
};

Payment.getRecentPayments = async function(walletAddress, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await this.findAll({
    where: {
      [Op.or]: [
        { payerWallet: walletAddress },
        { recipientWallet: walletAddress }
      ],
      createdAt: {
        [Op.gte]: startDate
      }
    },
    order: [['createdAt', 'DESC']]
  });
};

Payment.getStatsByPeriod = async function(walletAddress, period = 'month') {
  const whereClause = {
    payerWallet: walletAddress,
    status: 'completed'
  };

  let groupBy;
  let attributes;

  switch (period) {
    case 'day':
      groupBy = ['day'];
      attributes = [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'day'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ];
      break;
    case 'week':
      groupBy = ['week'];
      attributes = [
        [sequelize.fn('DATE_TRUNC', 'week', sequelize.col('createdAt')), 'week'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ];
      break;
    case 'month':
    default:
      groupBy = ['month'];
      attributes = [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ];
      break;
  }

  return await this.findAll({
    attributes,
    where: whereClause,
    group: groupBy,
    order: [[groupBy[0], 'ASC']]
  });
};

module.exports = Payment;