const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const paymentService = require('../services/paymentService');
const ResponseHandler = require('../utils/responseHandler');
const Payment = require('../models/Payment');
const Team = require('../models/Team');

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
    const userId = req.user.id;

    const userTeams = await Team.find({
      'members.userId': userId
    });

    const teamStats = await Promise.all(
      userTeams.map(async (team) => {
        const teamPayments = await Payment.find({
          teamId: team._id
        });

        const activeMembers = team.members.filter(m => m.isActive);

        return {
          id: team._id,
          name: team.name,
          totalPayments: teamPayments.length,
          totalAmount: teamPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
          memberCount: activeMembers.length
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

    const totalPayments = await Payment.countDocuments({ 
      payerWallet: req.user.walletAddress 
    });
    
    const completedPayments = await Payment.find({
      payerWallet: req.user.walletAddress,
      status: 'completed'
    });

    const totalAmount = completedPayments.reduce((sum, p) => sum + p.amount, 0);

    const userTeams = await Team.find({
      'members.userId': userId,
      'members.isActive': true
    });

    const overview = {
      totalPayments,
      totalAmount: totalAmount || 0,
      teamCount: userTeams.length,
      successRate: totalPayments > 0 ? 
        (completedPayments.length / totalPayments * 100).toFixed(2) : 0,
      activeTeams: userTeams.length
    };

    ResponseHandler.success(res, overview, 'Overview analytics retrieved successfully');
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
});

router.get('/monthly-stats', async (req, res) => {
  try {
    const userId = req.user.walletAddress;
    const currentYear = new Date(new Date().getFullYear(), 0, 1);

    const monthlyStats = await Payment.aggregate([
      {
        $match: {
          payerWallet: userId,
          status: 'completed',
          createdAt: { $gte: currentYear }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          paymentCount: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          month: '$_id',
          paymentCount: 1,
          totalAmount: 1,
          _id: 0
        }
      }
    ]);

    ResponseHandler.success(res, monthlyStats, 'Monthly stats retrieved successfully');
  } catch (error) {
    ResponseHandler.error(res, error.message);
  }
});

module.exports = router;