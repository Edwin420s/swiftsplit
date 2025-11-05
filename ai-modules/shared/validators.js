const { AI_CONFIG } = require('./constants');

class PaymentValidators {
  static validateAmount(amount) {
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error(`Invalid amount: ${amount}`);
    }
    return Math.round(amount * 100) / 100; // Round to 2 decimal places
  }

  static validateRecipients(recipients) {
    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new Error('Recipients array cannot be empty');
    }
    
    return recipients.map(recipient => {
      if (!recipient.name || !recipient.wallet) {
        throw new Error('Each recipient must have name and wallet');
      }
      return recipient;
    });
  }

  static validatePaymentIntent(intent) {
    const required = ['payer', 'recipients', 'amounts', 'currency'];
    const missing = required.filter(field => !intent[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    if (intent.recipients.length !== intent.amounts.length) {
      throw new Error('Recipients and amounts arrays must have same length');
    }
    
    return true;
  }
}

module.exports = { PaymentValidators };