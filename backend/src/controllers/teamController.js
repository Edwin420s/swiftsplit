const Team = require('../models/Team');
const User = require('../models/User');

class TeamController {
  async createTeam(req, res) {
    try {
      const { name, description, defaultSplitType, members } = req.body;
      const createdBy = req.user.id;

      const teamData = {
        name,
        description,
        defaultSplitType,
        createdBy,
        members: members || []
      };

      const team = new Team(teamData);
      await team.save();
      await team.populate('members.userId', 'name email walletAddress');

      res.json({
        success: true,
        team
      });
    } catch (error) {
      console.error('Team creation error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async addTeamMember(req, res) {
    try {
      const { teamId } = req.params;
      const { userId, splitPercentage, fixedAmount, role } = req.body;

      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({ success: false, error: 'Team not found' });
      }

      await team.addMember(userId, {
        splitPercentage: splitPercentage || 0,
        fixedAmount: fixedAmount || 0,
        role: role || 'member'
      });

      await team.populate('members.userId', 'name email walletAddress');
      const newMember = team.members[team.members.length - 1];

      res.json({
        success: true,
        member: newMember
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async calculateSplits(req, res) {
    try {
      const { teamId } = req.params;
      const { totalAmount } = req.body;

      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({ success: false, error: 'Team not found' });
      }

      const splits = await team.calculateSplits(parseFloat(totalAmount));
      
      res.json({
        success: true,
        splits,
        totalAmount
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }


  async getTeam(req, res) {
    try {
      const { teamId } = req.params;
      const team = await Team.findById(teamId)
        .populate('members.userId', 'name email walletAddress');
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
      const teams = await Team.find({ createdBy: req.user.id })
        .populate('members.userId', 'name email walletAddress');
      return res.json({ success: true, teams });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateTeam(req, res) {
    try {
      const { teamId } = req.params;
      const { name, description, defaultSplitType, members } = req.body;

      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({ success: false, error: 'Team not found' });
      }
      if (team.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to update team' });
      }

      if (name) team.name = name;
      if (description !== undefined) team.description = description;
      if (defaultSplitType) team.defaultSplitType = defaultSplitType;

      if (Array.isArray(members)) {
        team.members = members;
      }

      await team.save();
      await team.populate('members.userId', 'name email walletAddress');

      return res.json({ success: true, team });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async deleteTeam(req, res) {
    try {
      const { teamId } = req.params;
      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({ success: false, error: 'Team not found' });
      }
      if (team.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to delete team' });
      }

      await Team.findByIdAndDelete(teamId);

      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new TeamController();