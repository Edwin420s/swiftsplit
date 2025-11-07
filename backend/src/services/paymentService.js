const Payment = require('../models/Payment');
const Team = require('../models/Team');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const AILog = require('../models/AILog');
const ParsedInvoice = require('../models/ParsedInvoice');
const blockchainService = require('./blockchainService');

class PaymentService {
  async processTeamPayment(payerId, teamId, totalAmount, description, aiLogId = null) {
    try {
      // Get payer user
      const payer = await User.findById(payerId);
      if (!payer || !payer.walletAddress) {
        throw new Error('Payer wallet not found');
      }

      // Calculate splits
      const team = await Team.findById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }
      
      await team.populate('members.userId', 'name email walletAddress');

      if (!team) {
        throw new Error('Team not found');
      }

      const splits = await team.calculateSplits(totalAmount);
      
      // Validate all recipients have wallets
      for (const split of splits) {
        if (!split.walletAddress) {
          throw new Error(`Team member ${split.userId} does not have a wallet`);
        }
      }

      // Prepare recipients and amounts for blockchain
      const recipients = splits.map(split => split.walletAddress);
      const amounts = splits.map(split => split.amount);

      // Create payment record
      const payment = await Payment.create({
        amount: totalAmount,
        payerWallet: payer.walletAddress,
        recipientWallet: recipients[0], // Primary recipient
        description,
        status: 'pending',
        teamId,
        aiLogId,
        metadata: { splits }
      });

      // Execute blockchain transaction
      const invoiceId = `PAY-${payment.id.slice(0, 8)}`;
      const blockchainResult = await blockchainService.executePayment(
        recipients, 
        amounts, 
        invoiceId,
        payerId
      );

      if (blockchainResult.success) {
        await payment.update({
          status: 'completed',
          transactionHash: blockchainResult.transactionHash,
          metadata: { 
            ...payment.metadata,
            blockNumber: blockchainResult.blockNumber,
            gasUsed: blockchainResult.gasUsed
          }
        });

        // Create individual split payment records
        for (const split of splits) {
          await Payment.create({
            parentPaymentId: payment.id,
            amount: split.amount,
            payerWallet: payer.walletAddress,
            recipientWallet: split.walletAddress,
            status: 'completed',
            transactionHash: blockchainResult.transactionHash,
            description: `Team split payment - ${split.percentage}%`,
            teamId,
            metadata: { 
              userId: split.userId,
              percentage: split.percentage
            }
          });
        }

        // Update AI log if provided
        if (aiLogId) {
          await AILog.findByIdAndUpdate(aiLogId, {
            status: 'verified',
            paymentId: payment.id
          });
        }

        return {
          success: true,
          paymentId: payment.id,
          transactionHash: blockchainResult.transactionHash,
          blockNumber: blockchainResult.blockNumber,
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

  async processSinglePayment(payerId, recipientWallet, amount, description, aiLogId = null, invoiceId = null) {
    try {
      // Get payer user
      const payer = await User.findById(payerId);
      if (!payer || !payer.walletAddress) {
        throw new Error('Payer wallet not found');
      }

      // Validate recipient wallet format
      const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
      if (!ethAddressRegex.test(recipientWallet)) {
        throw new Error('Invalid recipient wallet address');
      }

      // Create payment record
      const payment = await Payment.create({
        amount,
        payerWallet: payer.walletAddress,
        recipientWallet,
        description,
        status: 'pending',
        aiLogId,
        metadata: { invoiceId }
      });

      // Execute blockchain transaction
      const paymentInvoiceId = invoiceId || `PAY-${payment.id.slice(0, 8)}`;
      const blockchainResult = await blockchainService.executePayment(
        [recipientWallet],
        [amount],
        paymentInvoiceId,
        payerId
      );

      if (blockchainResult.success) {
        await payment.update({
          status: 'completed',
          transactionHash: blockchainResult.transactionHash,
          metadata: {
            ...payment.metadata,
            blockNumber: blockchainResult.blockNumber,
            gasUsed: blockchainResult.gasUsed
          }
        });

        // Update AI log if provided
        if (aiLogId) {
          await AILog.findByIdAndUpdate(aiLogId, {
            status: 'verified',
            paymentId: payment.id
          });
        }

        // Update parsed invoice if provided
        if (invoiceId) {
          await ParsedInvoice.findOneAndUpdate(
            { invoiceId },
            { 
              paymentId: payment.id,
              paymentStatus: 'paid'
            }
          );
        }

        return {
          success: true,
          paymentId: payment.id,
          transactionHash: blockchainResult.transactionHash,
          blockNumber: blockchainResult.blockNumber,
          amount
        };
      } else {
        await payment.update({ status: 'failed' });
        throw new Error('Blockchain transaction failed: ' + blockchainResult.error);
      }
    } catch (error) {
      console.error('Single payment processing error:', error);
      throw error;
    }
  }

  async getPaymentAnalytics(userId, timeframe = '30d') {
    try {
      const query = {
        payerWallet: userId
      };

      // Add timeframe filter
      if (timeframe !== 'all') {
        const days = parseInt(timeframe);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        query.createdAt = { $gte: startDate };
      }

      const payments = await Payment.find(query)
        .sort({ createdAt: -1 });

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