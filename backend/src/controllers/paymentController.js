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
      const query = { payerWallet: req.user.walletAddress };
      if (status) query.status = status;

      const sortOrder = order.toUpperCase() === 'ASC' ? 1 : -1;
      const payments = await Payment.find(query)
        .sort({ [sort]: sortOrder })
        .limit(Math.min(parseInt(limit), 100))
        .skip(parseInt(offset));

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
      const payment = new Payment({
        amount: amounts.reduce((sum, amount) => sum + parseFloat(amount), 0),
        recipientWallet: recipients[0], // For now, single recipient
        payerWallet,
        description,
        status: 'pending'
      });
      await payment.save();

      // Execute on blockchain
      const blockchainResult = await blockchainService.executePayment(recipients, amounts);
      
      if (blockchainResult.success) {
        payment.status = 'completed';
        payment.transactionHash = blockchainResult.transactionHash;
        await payment.save();

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
        payment.status = 'failed';
        await payment.save();
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
      const payment = await Payment.findById(paymentId);
      
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
          user = await User.findOne({ email: r });
          if (!user) {
            user = await User.findOne({ name: r });
          }
        } else if (r && typeof r === 'object') {
          const { email, name, wallet } = r;
          if (wallet && Helpers.validateEthereumAddress(wallet)) {
            resolvedRecipients.push(wallet);
            continue;
          }
          if (email) {
            user = await User.findOne({ email });
          }
          if (!user && name) {
            user = await User.findOne({ name });
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

  async executePayment(req, res) {
    try {
      const { paymentId } = req.params;
      const payerWallet = req.user.walletAddress;

      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return res.status(404).json({ success: false, error: 'Payment not found' });
      }

      if (payment.payerWallet !== payerWallet) {
        return res.status(403).json({ success: false, error: 'Not authorized to execute this payment' });
      }

      if (payment.status === 'completed') {
        return res.status(400).json({ success: false, error: 'Payment already completed' });
      }
      if (payment.status === 'cancelled') {
        return res.status(400).json({ success: false, error: 'Payment has been cancelled' });
      }

      await payment.markAsProcessing();

      const recipients = [payment.recipientWallet];
      const amounts = [parseFloat(payment.amount)];

      const result = await blockchainService.executePayment(recipients, amounts);

      if (result.success) {
        await payment.markAsCompleted(result.transactionHash);

        req.app.get('socketio').emit('payment_completed', {
          paymentId: payment.id,
          transactionHash: result.transactionHash
        });

        return res.json({
          success: true,
          paymentId: payment.id,
          transactionHash: result.transactionHash
        });
      } else {
        await payment.markAsFailed(result.error || 'Blockchain transaction failed');
        return res.status(500).json({ success: false, error: result.error || 'Blockchain transaction failed' });
      }
    } catch (error) {
      console.error('Execute payment error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async cancelPayment(req, res) {
    try {
      const { paymentId } = req.params;
      const payerWallet = req.user.walletAddress;

      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return res.status(404).json({ success: false, error: 'Payment not found' });
      }

      if (payment.payerWallet !== payerWallet) {
        return res.status(403).json({ success: false, error: 'Not authorized to cancel this payment' });
      }

      if (payment.status === 'completed') {
        return res.status(400).json({ success: false, error: 'Cannot cancel a completed payment' });
      }
      if (payment.status === 'cancelled') {
        return res.json({ success: true, payment });
      }

      payment.status = 'cancelled';
      await payment.save();

      req.app.get('socketio').emit('payment_cancelled', {
        paymentId: payment.id
      });

      return res.json({ success: true, payment });
    } catch (error) {
      console.error('Cancel payment error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new PaymentController();