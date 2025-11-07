const Payment = require('../models/Payment');
const { Team, TeamMember } = require('../models/Team');
const blockchainService = require('./blockchainService');
const TeamController = require('../controllers/teamController');
const { Op } = require('sequelize');

class PaymentService {
  async processTeamPayment(payerId, teamId, totalAmount, description) {
    try {
      // Calculate splits
      const team = await Team.findByPk(teamId, {
        include: [{
          model: TeamMember,
          where: { isActive: true },
          include: [require('../models/User')]
        }]
      });

      if (!team) {
        throw new Error('Team not found');
      }

      const splits = TeamController.calculatePaymentSplits(team, totalAmount);
      
      // Prepare recipients and amounts for blockchain
      const recipients = splits.map(split => split.walletAddress);
      const amounts = splits.map(split => split.amount);

      // Create payment record
      const payment = await Payment.create({
        amount: totalAmount,
        payerWallet: payerId,
        description,
        status: 'pending',
        teamId
      });

      // Execute blockchain transaction
      const blockchainResult = await blockchainService.executePayment(recipients, amounts);

      if (blockchainResult.success) {
        await payment.update({
          status: 'completed',
          transactionHash: blockchainResult.transactionHash
        });

        // Create individual payment records for each team member
        const individualPayments = splits.map(split => ({
          parentPaymentId: payment.id,
          amount: split.amount,
          recipientWallet: split.walletAddress,
          status: 'completed',
          transactionHash: blockchainResult.transactionHash
        }));

        // Store individual payments (you might want a separate table for this)
        // For now, we'll log them

        return {
          success: true,
          paymentId: payment.id,
          transactionHash: blockchainResult.transactionHash,
          splits
        };
      } else {
        await payment.update({ status: 'failed' });
        throw new Error('Blockchain transaction failed: ' + blockchainResult.error);
      }
    } catch (error) {
      console.error('Team payment processing error:', error);
      throw error;
    }
  }

  async getPaymentAnalytics(userId, timeframe = '30d') {
    try {
      const whereClause = {
        payerWallet: userId
      };

      // Add timeframe filter
      if (timeframe !== 'all') {
        const days = parseInt(timeframe);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        whereClause.createdAt = { [Op.gte]: startDate };
      }

      const payments = await Payment.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']]
      });

      const totalAmount = payments.reduce((sum, payment) => 
        sum + parseFloat(payment.amount), 0
      );
      
      const completedPayments = payments.filter(p => p.status === 'completed');
      const failedPayments = payments.filter(p => p.status === 'failed');

      return {
        totalPayments: payments.length,
        completedPayments: completedPayments.length,
        failedPayments: failedPayments.length,
        totalAmount,
        averageAmount: totalAmount / (payments.length || 1),
        payments: payments.slice(0, 10) // Last 10 payments
      };
    } catch (error) {
      console.error('Analytics error:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();