const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Team = sequelize.define('Team', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  defaultSplitType: {
    type: DataTypes.ENUM('equal', 'percentage', 'fixed'),
    defaultValue: 'equal'
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  tableName: 'teams',
  timestamps: true
});

const TeamMember = sequelize.define('TeamMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  teamId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Teams',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  splitPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  fixedAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'team_members',
  timestamps: true
});

// Associations
Team.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Team.hasMany(TeamMember, { foreignKey: 'teamId', as: 'members' });
TeamMember.belongsTo(Team, { foreignKey: 'teamId' });
TeamMember.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(TeamMember, { foreignKey: 'userId' });

// Instance methods
Team.prototype.getActiveMembers = async function() {
  return await TeamMember.findAll({
    where: { 
      teamId: this.id,
      isActive: true 
    },
    include: [User]
  });
};

Team.prototype.calculateSplits = function(totalAmount) {
  const members = this.members || [];
  const activeMembers = members.filter(m => m.isActive);
  
  switch (this.defaultSplitType) {
    case 'equal':
      const equalAmount = totalAmount / activeMembers.length;
      return activeMembers.map(member => ({
        userId: member.userId,
        walletAddress: member.User.walletAddress,
        amount: equalAmount,
        percentage: 100 / activeMembers.length
      }));

    case 'percentage':
      return activeMembers.map(member => ({
        userId: member.userId,
        walletAddress: member.User.walletAddress,
        amount: totalAmount * (member.splitPercentage / 100),
        percentage: member.splitPercentage
      }));

    case 'fixed':
      return activeMembers.map(member => ({
        userId: member.userId,
        walletAddress: member.User.walletAddress,
        amount: member.fixedAmount,
        percentage: (member.fixedAmount / totalAmount) * 100
      }));

    default:
      throw new Error('Invalid split type');
  }
};

// Static methods
Team.getUserTeams = async function(userId) {
  return await Team.findAll({
    include: [{
      model: TeamMember,
      where: { userId },
      required: true
    }]
  });
};

module.exports = { Team, TeamMember };