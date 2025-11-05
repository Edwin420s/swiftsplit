const { DataTypes, Op } = require('sequelize');
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
      notEmpty: true,
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    validate: {
      len: [0, 500]
    }
  },
  defaultSplitType: {
    type: DataTypes.ENUM('equal', 'percentage', 'fixed'),
    defaultValue: 'equal',
    validate: {
      isIn: [['equal', 'percentage', 'fixed']]
    }
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
  timestamps: true,
  indexes: [
    {
      fields: ['createdBy']
    },
    {
      fields: ['name']
    }
  ]
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
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  role: {
    type: DataTypes.ENUM('member', 'manager'),
    defaultValue: 'member'
  }
}, {
  tableName: 'team_members',
  timestamps: true,
  indexes: [
    {
      fields: ['teamId', 'userId'],
      unique: true
    },
    {
      fields: ['userId']
    }
  ]
});

// Associations
Team.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Team.hasMany(TeamMember, { foreignKey: 'teamId', as: 'members' });
TeamMember.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });
TeamMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(TeamMember, { foreignKey: 'userId', as: 'teamMemberships' });

// Team Instance Methods
Team.prototype.getActiveMembers = async function() {
  return await TeamMember.findAll({
    where: { 
      teamId: this.id,
      isActive: true 
    },
    include: [{ model: User, as: 'user' }]
  });
};

Team.prototype.calculateSplits = function(totalAmount) {
  const members = this.members || [];
  const activeMembers = members.filter(m => m.isActive);
  
  if (activeMembers.length === 0) {
    throw new Error('No active team members');
  }

  let splits;
  switch (this.defaultSplitType) {
    case 'equal':
      const equalAmount = totalAmount / activeMembers.length;
      splits = activeMembers.map(member => ({
        userId: member.userId,
        walletAddress: member.user.walletAddress,
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
        userId: member.userId,
        walletAddress: member.user.walletAddress,
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
        userId: member.userId,
        walletAddress: member.user.walletAddress,
        amount: parseFloat(member.fixedAmount),
        percentage: parseFloat(((member.fixedAmount / totalAmount) * 100).toFixed(2))
      }));
      break;

    default:
      throw new Error('Invalid split type');
  }

  return splits;
};

Team.prototype.addMember = async function(userId, options = {}) {
  const { splitPercentage = 0, fixedAmount = 0, role = 'member' } = options;
  
  return await TeamMember.create({
    teamId: this.id,
    userId,
    splitPercentage,
    fixedAmount,
    role
  });
};

// Team Static Methods
Team.getUserTeams = async function(userId) {
  return await Team.findAll({
    include: [{
      model: TeamMember,
      as: 'members',
      where: { userId },
      required: true
    }]
  });
};

Team.findByUserAndId = async function(userId, teamId) {
  return await Team.findOne({
    where: { id: teamId },
    include: [{
      model: TeamMember,
      as: 'members',
      where: { userId },
      required: true
    }]
  });
};

// TeamMember Instance Methods
TeamMember.prototype.activate = function() {
  return this.update({ isActive: true });
};

TeamMember.prototype.deactivate = function() {
  return this.update({ isActive: false });
};

// TeamMember Static Methods
TeamMember.getUserTeams = async function(userId) {
  return await TeamMember.findAll({
    where: { userId, isActive: true },
    include: [{ model: Team, as: 'team' }]
  });
};

module.exports = { Team, TeamMember };