const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Team = sequelize.define('Team', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  defaultSplitType: {
    type: DataTypes.ENUM('equal', 'percentage', 'fixed'),
    defaultValue: 'equal'
  }
});

const TeamMember = sequelize.define('TeamMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  splitPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  fixedAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

// Associations
Team.hasMany(TeamMember, { foreignKey: 'teamId' });
TeamMember.belongsTo(Team, { foreignKey: 'teamId' });
TeamMember.belongsTo(require('./User'), { foreignKey: 'userId' });

module.exports = { Team, TeamMember };