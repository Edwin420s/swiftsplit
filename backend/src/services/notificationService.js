const EmailService = require('./emailService');

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
          timestamp: new Date()
        });

        // Notify recipients
        recipients.forEach(recipient => {
          this.io.to(`user_${recipient.walletAddress}`).emit('payment_received', {
            paymentId: payment.id,
            amount: recipient.amount,
            from: payment.payerWallet,
            timestamp: new Date()
          });
        });
      }

      // Email notifications
      const payerUser = await require('../models/User').findOne({ 
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
        const recipientUser = await require('../models/User').findOne({ 
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

      return { success: true };
    } catch (error) {
      console.error('Notification error:', error);
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
          timestamp: new Date()
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

      return { success: true };
    } catch (error) {
      console.error('Team notification error:', error);
      return { success: false, error: error.message };
    }
  }

  async notifyPaymentFailed(payment, error) {
    try {
      if (this.io) {
        this.io.to(`user_${payment.payerWallet}`).emit('payment_failed', {
          paymentId: payment.id,
          error: error.message,
          timestamp: new Date()
        });
      }

      const user = await require('../models/User').findOne({ 
        where: { walletAddress: payment.payerWallet } 
      });

      if (user && user.email) {
        // Send failure email (you'd need to implement this in EmailService)
        console.log(`Payment failed email would be sent to: ${user.email}`);
      }

      return { success: true };
    } catch (notificationError) {
      console.error('Failure notification error:', notificationError);
      return { success: false, error: notificationError.message };
    }
  }
}

module.exports = new NotificationService();