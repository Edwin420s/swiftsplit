const { Team, TeamMember } = require('../models/Team');
const User = require('../models/User');

class TeamController {
  async createTeam(req, res) {
    try {
      const { name, description, defaultSplitType, members } = req.body;
      const createdBy = req.user.id;

      const team = await Team.create({
        name,
        description,
        defaultSplitType,
        createdBy
      });

      // Add team members
      if (members && members.length > 0) {
        const teamMembers = members.map(member => ({
          teamId: team.id,
          userId: member.userId,
          splitPercentage: member.splitPercentage || 0,
          fixedAmount: member.fixedAmount || 0
        }));
        await TeamMember.bulkCreate(teamMembers);
      }

      const teamWithMembers = await Team.findByPk(team.id, {
        include: [{
          model: TeamMember,
          include: [User]
        }]
      });

      res.json({
        success: true,
        team: teamWithMembers
      });
    } catch (error) {
      console.error('Team creation error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async addTeamMember(req, res) {
    try {
      const { teamId } = req.params;
      const { userId, splitPercentage, fixedAmount } = req.body;

      const team = await Team.findByPk(teamId);
      if (!team) {
        return res.status(404).json({ success: false, error: 'Team not found' });
      }

      const teamMember = await TeamMember.create({
        teamId,
        userId,
        splitPercentage: splitPercentage || 0,
        fixedAmount: fixedAmount || 0
      });

      const memberWithUser = await TeamMember.findByPk(teamMember.id, {
        include: [User]
      });

      res.json({
        success: true,
        member: memberWithUser
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async calculateSplits(req, res) {
    try {
      const { teamId } = req.params;
      const { totalAmount } = req.body;

      const team = await Team.findByPk(teamId, {
        include: [{
          model: TeamMember,
          where: { isActive: true },
          include: [User]
        }]
      });

      if (!team) {
        return res.status(404).json({ success: false, error: 'Team not found' });
      }

      const splits = this.calculatePaymentSplits(team, parseFloat(totalAmount));
      
      res.json({
        success: true,
        splits,
        totalAmount
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  calculatePaymentSplits(team, totalAmount) {
    const { TeamMembers, defaultSplitType } = team;
    
    switch (defaultSplitType) {
      case 'equal':
        const equalAmount = totalAmount / TeamMembers.length;
        return TeamMembers.map(member => ({
          userId: member.User.id,
          walletAddress: member.User.walletAddress,
          amount: equalAmount,
          percentage: 100 / TeamMembers.length
        }));

      case 'percentage':
        return TeamMembers.map(member => ({
          userId: member.User.id,
          walletAddress: member.User.walletAddress,
          amount: totalAmount * (member.splitPercentage / 100),
          percentage: member.splitPercentage
        }));

      case 'fixed':
        return TeamMembers.map(member => ({
          userId: member.User.id,
          walletAddress: member.User.walletAddress,
          amount: member.fixedAmount,
          percentage: (member.fixedAmount / totalAmount) * 100
        }));

      default:
        throw new Error('Invalid split type');
    }
  }

  async getTeam(req, res) {
    try {
      const { teamId } = req.params;
      const team = await Team.findByPk(teamId, {
        include: [{
          model: TeamMember,
          include: [User]
        }]
      });
      if (!team) {
        return res.status(404).json({ success: false, error: 'Team not found' });
      }
      return res.json({ success: true, team });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async getUserTeams(req, res) {
    try {
      const teams = await Team.findAll({
        where: { createdBy: req.user.id },
        include: [{ model: TeamMember, include: [User] }]
      });
      return res.json({ success: true, teams });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateTeam(req, res) {
    try {
      const { teamId } = req.params;
      const { name, description, defaultSplitType, members } = req.body;

      const team = await Team.findByPk(teamId);
      if (!team) {
        return res.status(404).json({ success: false, error: 'Team not found' });
      }
      if (team.createdBy !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to update team' });
      }

      await team.update({
        name: name ?? team.name,
        description: description ?? team.description,
        defaultSplitType: defaultSplitType ?? team.defaultSplitType
      });

      if (Array.isArray(members)) {
        await TeamMember.destroy({ where: { teamId: team.id } });
        const teamMembers = members.map(m => ({
          teamId: team.id,
          userId: m.userId,
          splitPercentage: m.splitPercentage || 0,
          fixedAmount: m.fixedAmount || 0,
          isActive: m.isActive !== false
        }));
        if (teamMembers.length) {
          await TeamMember.bulkCreate(teamMembers);
        }
      }

      const updated = await Team.findByPk(team.id, {
        include: [{ model: TeamMember, include: [User] }]
      });

      return res.json({ success: true, team: updated });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async deleteTeam(req, res) {
    try {
      const { teamId } = req.params;
      const team = await Team.findByPk(teamId);
      if (!team) {
        return res.status(404).json({ success: false, error: 'Team not found' });
      }
      if (team.createdBy !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to delete team' });
      }

      await TeamMember.destroy({ where: { teamId } });
      await Team.destroy({ where: { id: teamId } });

      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new TeamController();