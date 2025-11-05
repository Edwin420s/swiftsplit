const Payment = require('../models/Payment');
const User = require('../models/User');
const blockchainService = require('../services/blockchainService');
const aiService = require('../services/aiService');

class PaymentController {
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

      // Create payment from parsed data
      return this.createPayment({
        ...req,
        body: {
          recipients: parsedData.recipients,
          amounts: parsedData.amounts,
          description: parsedData.purpose,
          aiLogId: parsedData.logId
        }
      }, res);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new PaymentController();