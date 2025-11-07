const Payment = require('../models/Payment');
const User = require('../models/User');
const blockchainService = require('../services/blockchainService');
const aiService = require('../services/aiService');
const paymentService = require('../services/paymentService');
const Helpers = require('../utils/helpers');

class PaymentController {
  async listPayments(req, res) {
    try {
      const { status, limit = 20, offset = 0, sort = 'createdAt', order = 'DESC' } = req.query;
      const where = { payerWallet: req.user.walletAddress };
      if (status) where.status = status;

      const payments = await Payment.findAll({
        where,
        limit: Math.min(parseInt(limit), 100),
        offset: parseInt(offset),
        order: [[sort, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']]
      });

      return res.json({ success: true, payments });
    } catch (error) {
      console.error('Payments list error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  async createPayment(req, res) {
    try {
      const { recipients, amounts, description, aiLogId } = req.body;
      const payerWallet = req.user.walletAddress;

      // Validate recipients and amounts
      if (!recipients || !amounts || recipients.length !== amounts.length) {
        return res.status(400).json({
          success: false,
          error: 'Recipients and amounts arrays must have same length'
        });
      }

      // Create payment record
      const payment = await Payment.create({
        amount: amounts.reduce((sum, amount) => sum + parseFloat(amount), 0),
        recipientWallet: recipients[0], // For now, single recipient
        payerWallet,
        description,
        status: 'pending'
      });

      // Execute on blockchain
      const blockchainResult = await blockchainService.executePayment(recipients, amounts);
      
      if (blockchainResult.success) {
        await payment.update({
          status: 'completed',
          transactionHash: blockchainResult.transactionHash
        });

        // Emit real-time update
        req.app.get('socketio').emit('payment_completed', {
          paymentId: payment.id,
          transactionHash: blockchainResult.transactionHash
        });

        return res.json({
          success: true,
          paymentId: payment.id,
          transactionHash: blockchainResult.transactionHash
        });
      } else {
        await payment.update({ status: 'failed' });
        return res.status(500).json({
          success: false,
          error: 'Blockchain transaction failed'
        });
      }
    } catch (error) {
      console.error('Payment creation error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getPaymentStatus(req, res) {
    try {
      const { paymentId } = req.params;
      const payment = await Payment.findByPk(paymentId);
      
      if (!payment) {
        return res.status(404).json({ success: false, error: 'Payment not found' });
      }

      res.json({ success: true, payment });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async parseAndCreatePayment(req, res) {
    try {
      let parsedData;

      if (req.file) {
        // Invoice upload
        const result = await aiService.parseInvoice(req.file);
        if (!result.success) {
          return res.status(400).json(result);
        }
        parsedData = result.data;
      } else if (req.body.message) {
        // Chat message
        const result = await aiService.parseChatMessage(req.body.message);
        if (!result.success) {
          return res.status(400).json(result);
        }
        parsedData = result.data;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Either file or message required'
        });
      }

      // Resolve recipients to wallet addresses
      const resolvedRecipients = [];
      for (const r of parsedData.recipients || []) {
        // If already an address, keep it
        if (typeof r === 'string' && Helpers.validateEthereumAddress(r)) {
          resolvedRecipients.push(r);
          continue;
        }

        // Try to resolve by email or name
        let user = null;
        if (typeof r === 'string') {
          user = await User.findOne({ where: { email: r } });
          if (!user) {
            user = await User.findOne({ where: { name: r } });
          }
        } else if (r && typeof r === 'object') {
          const { email, name, wallet } = r;
          if (wallet && Helpers.validateEthereumAddress(wallet)) {
            resolvedRecipients.push(wallet);
            continue;
          }
          if (email) {
            user = await User.findOne({ where: { email } });
          }
          if (!user && name) {
            user = await User.findOne({ where: { name } });
          }
        }

        if (user && user.walletAddress && Helpers.validateEthereumAddress(user.walletAddress)) {
          resolvedRecipients.push(user.walletAddress);
        }
      }

      if (!resolvedRecipients.length) {
        return res.status(400).json({ success: false, error: 'Could not resolve any recipient wallet addresses' });
      }

      // Create payment from parsed data with resolved recipients
      return this.createPayment({
        ...req,
        body: {
          recipients: resolvedRecipients,
          amounts: parsedData.amounts,
          description: parsedData.purpose,
          aiLogId: parsedData.logId
        }
      }, res);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createTeamPayment(req, res) {
    try {
      const { teamId, totalAmount, description } = req.body;
      const payerWallet = req.user.walletAddress;

      const result = await paymentService.processTeamPayment(
        payerWallet,
        teamId,
        totalAmount,
        description
      );

      if (result.success) {
        // Emit real-time update
        req.app.get('socketio').emit('team_payment_completed', {
          paymentId: result.paymentId,
          teamId,
          splits: result.splits
        });

        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('Team payment error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getPaymentAnalytics(req, res) {
    try {
      const { timeframe } = req.query;
      const userId = req.user.walletAddress;

      const analytics = await paymentService.getPaymentAnalytics(userId, timeframe);
      res.json({ success: true, analytics });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new PaymentController();