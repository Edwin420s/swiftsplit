const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const paymentService = require('../services/paymentService');
const ResponseHandler = require('../utils/responseHandler');

const router = express.Router();

router.use(authMiddleware);

router.get('/payments', async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const userId = req.user.walletAddress;

    const analytics = await paymentService.getPaymentAnalytics(userId, timeframe);
    ResponseHandler.success(res, analytics, 'Analytics retrieved successfully');
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
});

router.get('/teams', async (req, res) => {
  try {
    const { Team, TeamMember } = require('../models/Team');
    const userId = req.user.id;

    const userTeams = await Team.findAll({
      include: [{
        model: TeamMember,
        where: { userId },
        required: true
      }]
    });

    const teamStats = await Promise.all(
      userTeams.map(async (team) => {
        const { Payment } = require('../models/Payment');
        const teamPayments = await Payment.findAll({
          where: { teamId: team.id }
        });

        return {
          id: team.id,
          name: team.name,
          totalPayments: teamPayments.length,
          totalAmount: teamPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
          memberCount: await TeamMember.count({ where: { teamId: team.id } })
        };
      })
    );

    ResponseHandler.success(res, teamStats, 'Team analytics retrieved successfully');
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
});

router.get('/overview', async (req, res) => {
  try {
    const userId = req.user.id;
    const { Payment } = require('../models/Payment');
    const { TeamMember } = require('../models/Team');

    const totalPayments = await Payment.count({ 
      where: { payerWallet: req.user.walletAddress } 
    });
    
    const totalAmount = await Payment.sum('amount', { 
      where: { payerWallet: req.user.walletAddress, status: 'completed' } 
    });

    const teamCount = await TeamMember.count({ 
      where: { userId } 
    });

    const overview = {
      totalPayments,
      totalAmount: totalAmount || 0,
      teamCount,
      successRate: totalPayments > 0 ? 
        (await Payment.count({ where: { payerWallet: req.user.walletAddress, status: 'completed' } })) / totalPayments * 100 : 0
    };

    ResponseHandler.success(res, overview, 'Overview analytics retrieved successfully');
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
});

module.exports = router;