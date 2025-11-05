const EmailService = require('./emailService');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.io = null;
  }

  setSocketIO(io) {
    this.io = io;
  }

  async notifyPaymentCompleted(payment, recipients) {
    try {
      // Socket.io notifications
      if (this.io) {
        this.io.to(`user_${payment.payerWallet}`).emit('payment_completed', {
          paymentId: payment.id,
          amount: payment.amount,
          transactionHash: payment.transactionHash,
          timestamp: new Date().toISOString()
        });

        // Notify recipients
        recipients.forEach(recipient => {
          this.io.to(`user_${recipient.walletAddress}`).emit('payment_received', {
            paymentId: payment.id,
            amount: recipient.amount,
            from: payment.payerWallet,
            timestamp: new Date().toISOString()
          });
        });
      }

      // Email notifications
      const User = require('../models/User');
      const payerUser = await User.findOne({ 
        where: { walletAddress: payment.payerWallet } 
      });

      if (payerUser && payerUser.email) {
        await EmailService.sendPaymentNotification(payerUser.email, {
          amount: payment.amount,
          payer: 'You',
          description: payment.description,
          transactionHash: payment.transactionHash
        });
      }

      // Notify recipients via email
      for (const recipient of recipients) {
        const recipientUser = await User.findOne({ 
          where: { walletAddress: recipient.walletAddress } 
        });
        
        if (recipientUser && recipientUser.email) {
          await EmailService.sendPaymentNotification(recipientUser.email, {
            amount: recipient.amount,
            payer: payerUser ? payerUser.name : payment.payerWallet,
            description: payment.description,
            transactionHash: payment.transactionHash
          });
        }
      }

      logger.info(`Payment notifications sent for payment ${payment.id}`);
      return { success: true };
    } catch (error) {
      logger.error('Payment notification error:', error);
      return { success: false, error: error.message };
    }
  }

  async notifyTeamPaymentCompleted(payment, team, splits) {
    try {
      if (this.io) {
        this.io.to(`team_${team.id}`).emit('team_payment_completed', {
          paymentId: payment.id,
          teamId: team.id,
          totalAmount: payment.amount,
          splits: splits,
          timestamp: new Date().toISOString()
        });
      }

      // Get team member emails
      const { TeamMember } = require('../models/Team');
      const User = require('../models/User');
      
      const teamMembers = await TeamMember.findAll({
        where: { teamId: team.id, isActive: true },
        include: [User]
      });

      const emails = teamMembers.map(member => member.User.email).filter(email => email);
      const userAmounts = splits.map(split => ({
        email: teamMembers.find(m => m.User.walletAddress === split.walletAddress)?.User.email,
        amount: split.amount
      }));

      // Send team payment emails
      for (const userAmount of userAmounts) {
        if (userAmount.email) {
          await EmailService.sendTeamPaymentNotification([userAmount.email], {
            totalAmount: payment.amount,
            userAmount: userAmount.amount,
            description: payment.description,
            transactionHash: payment.transactionHash
          });
        }
      }

      logger.info(`Team payment notifications sent for team ${team.id}, payment ${payment.id}`);
      return { success: true };
    } catch (error) {
      logger.error('Team notification error:', error);
      return { success: false, error: error.message };
    }
  }

  async notifyPaymentFailed(payment, error) {
    try {
      if (this.io) {
        this.io.to(`user_${payment.payerWallet}`).emit('payment_failed', {
          paymentId: payment.id,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }

      const User = require('../models/User');
      const user = await User.findOne({ 
        where: { walletAddress: payment.payerWallet } 
      });

      if (user && user.email) {
        // In a real implementation, you'd send a failure email
        logger.info(`Payment failure notification would be sent to: ${user.email}`);
      }

      logger.warn(`Payment failed notification sent for payment ${payment.id}`);
      return { success: true };
    } catch (notificationError) {
      logger.error('Failure notification error:', notificationError);
      return { success: false, error: notificationError.message };
    }
  }

  async notifyInvoiceParsed(userId, invoiceData, success) {
    try {
      if (this.io) {
        this.io.to(`user_${userId}`).emit('invoice_parsed', {
          success,
          data: invoiceData,
          timestamp: new Date().toISOString()
        });
      }

      logger.info(`Invoice parsed notification sent to user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error('Invoice notification error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new NotificationService();