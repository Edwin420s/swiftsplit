// AI configuration constants
const AI_CONFIG = {
  // Confidence thresholds
  MIN_CONFIDENCE: 0.85,
  HIGH_CONFIDENCE: 0.95,
  
  // Payment intent patterns
  PAYMENT_PATTERNS: {
    BASIC_PAYMENT: /(?:pay|send|transfer)\s+(?:@)?(\w+)\s+\$?(\d+(?:\.\d{2})?)/i,
    SPLIT_PAYMENT: /(?:split|divide)\s+\$?(\d+(?:\.\d{2})?)\s+(?:among|between|to)\s+(.+)/i,
    TIP_PAYMENT: /(?:tip)\s+(?:@)?(\w+)\s+\$?(\d+(?:\.\d{2})?)/i
  },
  
  // Currency symbols
  CURRENCIES: ['$', 'USDC', 'USD'],
  
  // Common payment purposes
  PAYMENT_PURPOSES: [
    'website', 'design', 'development', 'logo', 
    'content', 'writing', 'marketing', 'consulting'
  ]
};

module.exports = { AI_CONFIG };