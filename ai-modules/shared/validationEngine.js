const { AI_CONFIG } = require('./constants');

class PaymentValidator {
  constructor() {
    this.riskPatterns = [];
    this.suspiciousKeywords = [
      'urgent', 'immediately', 'asap', 'emergency', 'secret',
      'confidential', 'wire transfer', 'western union'
    ];
  }

  async loadRiskPatterns() {
    // In production, this would load from a database or API
    this.riskPatterns = [
      { pattern: /payment.*double/i, risk: 'high', reason: 'Duplicate payment request' },
      { pattern: /pay.*unknown/i, risk: 'medium', reason: 'Unknown recipient' },
      { pattern: /\$(\d{5,})/i, risk: 'high', reason: 'Unusually large amount' }
    ];
  }

  async validatePayment(paymentIntent) {
    const issues = [];
    const warnings = [];
    let riskScore = 0;

    // Basic validation
    if (!paymentIntent.recipients || paymentIntent.recipients.length === 0) {
      issues.push('No recipients specified');
    }

    if (!paymentIntent.amounts || paymentIntent.amounts.some(amt => amt <= 0)) {
      issues.push('Invalid payment amounts');
    }

    // Amount validation
    const totalAmount = paymentIntent.amounts.reduce((sum, amt) => sum + amt, 0);
    if (totalAmount > 10000) { // $10,000 threshold
      warnings.push('Large payment amount detected');
      riskScore += 30;
    }

    // Confidence check
    if (paymentIntent.confidence < AI_CONFIG.MIN_CONFIDENCE) {
      warnings.push(`Low confidence score: ${paymentIntent.confidence}`);
      riskScore += 20;
    }

    // Risk pattern matching
    const description = `${paymentIntent.purpose} ${paymentIntent.recipients.map(r => r.name).join(' ')}`.toLowerCase();
    
    for (const riskPattern of this.riskPatterns) {
      if (riskPattern.pattern.test(description)) {
        warnings.push(`Risk pattern detected: ${riskPattern.reason}`);
        riskScore += riskPattern.risk === 'high' ? 40 : 20;
      }
    }

    // Suspicious keyword check
    for (const keyword of this.suspiciousKeywords) {
      if (description.includes(keyword)) {
        warnings.push(`Suspicious keyword detected: ${keyword}`);
        riskScore += 25;
      }
    }

    // Frequency check (mock - in real system, check against history)
    const recentPayments = await this.getRecentPayments(paymentIntent.payer);
    if (recentPayments.length > 5) {
      warnings.push('Unusually high payment frequency');
      riskScore += 15;
    }

    return {
      isValid: issues.length === 0,
      isApproved: riskScore < 50, // Threshold for auto-approval
      riskScore: Math.min(riskScore, 100),
      issues,
      warnings,
      requiresReview: riskScore >= 50,
      validationDate: new Date().toISOString()
    };
  }

  async getRecentPayments(payer) {
    // Mock implementation - in production, query your database
    return [];
  }

  validateRecipient(recipient) {
    const issues = [];
    
    if (!recipient.name || recipient.name.trim().length < 2) {
      issues.push('Recipient name is too short');
    }
    
    if (recipient.name.length > 100) {
      issues.push('Recipient name is too long');
    }
    
    // Basic name validation (no special characters except spaces and hyphens)
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(recipient.name)) {
      issues.push('Recipient name contains invalid characters');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

module.exports = { PaymentValidator };