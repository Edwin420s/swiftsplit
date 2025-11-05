const { IntentDetector } = require('./intentDetector');
const { PaymentValidators } = require('../shared/validators');

class ChatParser {
  constructor() {
    this.intentDetector = new IntentDetector();
  }

  /**
   * Parse chat message for payment intent
   * @param {string} message - The chat message
   * @param {string} sender - Who sent the message
   * @returns {Object} Parsed payment intent
   */
  async parseChatMessage(message, sender = 'Client') {
    try {
      console.log(`Parsing chat message from ${sender}: "${message}"`);
      
      // Detect payment intent
      const intentResult = this.intentDetector.detectPaymentIntent(message);
      
      if (intentResult.intent === 'UNKNOWN' || intentResult.confidence < 0.6) {
        throw new Error('No clear payment intent detected in message');
      }

      // Extract payment details
      const recipients = this.intentDetector.extractRecipients(message, intentResult.match);
      const amount = this.intentDetector.extractAmount(message, intentResult.match);
      const purpose = this.intentDetector.extractPurpose(message);

      // Handle split payments
      let amounts;
      if (intentResult.intent === 'SPLIT_PAYMENT' && recipients.length > 1) {
        amounts = this.calculateSplitAmounts(amount, recipients);
      } else {
        amounts = [PaymentValidators.validateAmount(amount)];
      }

      const paymentIntent = {
        payer: sender,
        recipients: recipients,
        amounts: amounts,
        currency: 'USDC',
        purpose: purpose,
        confidence: intentResult.confidence,
        source: 'chat',
        intent: intentResult.intent
      };

      PaymentValidators.validatePaymentIntent(paymentIntent);
      
      console.log('Chat message parsed successfully:', {
        intent: paymentIntent.intent,
        recipients: paymentIntent.recipients.length,
        totalAmount: paymentIntent.amounts.reduce((a, b) => a + b, 0),
        confidence: paymentIntent.confidence
      });

      return {
        success: true,
        data: paymentIntent
      };

    } catch (error) {
      console.warn('Chat parsing failed:', error.message);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  calculateSplitAmounts(totalAmount, recipients) {
    const recipientCount = recipients.length;
    const equalShare = totalAmount / recipientCount;
    
    return recipients.map(() => 
      PaymentValidators.validateAmount(equalShare)
    );
  }

  /**
   * Process multiple chat messages
   * @param {Array} messages - Array of {text, sender} objects
   * @returns {Array} Results for all messages
   */
  async parseMultipleMessages(messages) {
    const results = [];
    
    for (const message of messages) {
      const result = await this.parseChatMessage(message.text, message.sender);
      results.push(result);
    }
    
    return results;
  }
}

// Export singleton instance
module.exports = new ChatParser();