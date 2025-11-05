const { AI_CONFIG } = require('../shared/constants');

class IntentDetector {
  detectPaymentIntent(text) {
    const lowerText = text.toLowerCase().trim();
    
    // Check for basic payment patterns
    for (const [intentType, pattern] of Object.entries(AI_CONFIG.PAYMENT_PATTERNS)) {
      const match = lowerText.match(pattern);
      if (match) {
        return {
          intent: intentType,
          match: match,
          confidence: this.calculateConfidence(lowerText, intentType)
        };
      }
    }
    
    return {
      intent: 'UNKNOWN',
      match: null,
      confidence: 0
    };
  }

  calculateConfidence(text, intentType) {
    let confidence = 0.7; // Base confidence for detected intent
    
    // Increase confidence for clear payment keywords
    const strongIndicators = ['pay', 'send', 'transfer', 'usdc', 'tip'];
    const weakIndicators = ['money', 'cash', 'funds', 'dollars'];
    
    strongIndicators.forEach(indicator => {
      if (text.includes(indicator)) confidence += 0.1;
    });
    
    weakIndicators.forEach(indicator => {
      if (text.includes(indicator)) confidence += 0.05;
    });
    
    // Cap at 1.0
    return Math.min(confidence, 1.0);
  }

  extractRecipients(text, intentMatch) {
    const recipients = [];
    
    if (intentMatch) {
      if (intentMatch[1]) { // Single recipient
        recipients.push({
          name: intentMatch[1].trim(),
          wallet: null, // Will be resolved later
          share: 100
        });
      }
      
      if (intentMatch[2]) { // Multiple recipients in split
        const recipientList = intentMatch[2].split(/,\s*|\s+and\s+/);
        recipientList.forEach(recipient => {
          recipients.push({
            name: recipient.trim(),
            wallet: null,
            share: null // To be calculated
          });
        });
      }
    }
    
    return recipients;
  }

  extractAmount(text, intentMatch) {
    if (intentMatch && intentMatch[2]) {
      const amount = parseFloat(intentMatch[2]);
      if (!isNaN(amount) && amount > 0) {
        return amount;
      }
    }
    
    // Fallback: look for amount patterns in text
    const amountPattern = /\$?(\d+(?:\.\d{2})?)/g;
    const matches = text.match(amountPattern);
    
    if (matches) {
      const amounts = matches.map(match => parseFloat(match.replace('$', '')))
                           .filter(amount => !isNaN(amount) && amount > 0);
      if (amounts.length > 0) {
        return Math.max(...amounts); // Return largest amount found
      }
    }
    
    throw new Error('No valid amount found in message');
  }

  extractPurpose(text) {
    const purposePatterns = [
      /for\s+(.+?)(?:\s+(?:please|thanks|\.|$))/i,
      /payment\s+for\s+(.+)/i,
      /for\s+(\w+\s+\w+)/i
    ];
    
    for (const pattern of purposePatterns) {
      const match = text.match(pattern);
      if (match) {
        const purpose = match[1].trim();
        const knownPurpose = AI_CONFIG.PAYMENT_PURPOSES.find(p => 
          purpose.toLowerCase().includes(p)
        );
        return knownPurpose || purpose;
      }
    }
    
    return 'Professional services';
  }
}

module.exports = { IntentDetector };