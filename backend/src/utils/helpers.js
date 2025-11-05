const ethers = require('ethers');

class Helpers {
  static validateEthereumAddress(address) {
    return ethers.isAddress(address);
  }

  static formatUSDCAmount(amount) {
    return ethers.parseUnits(amount.toString(), 6).toString();
  }

  static parseUSDCAmount(amount) {
    return ethers.formatUnits(amount, 6);
  }

  static generateInvoiceNumber() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${timestamp}-${random}`;
  }

  static sanitizeUserInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/[<>]/g, '')
      .trim()
      .substring(0, 1000);
  }

  static calculateFees(amount, feePercentage = 0.5) {
    const fee = (amount * feePercentage) / 100;
    const netAmount = amount - fee;
    
    return {
      grossAmount: amount,
      fee,
      netAmount,
      feePercentage
    };
  }

  static async retryOperation(operation, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.log(`Attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }
    
    throw lastError;
  }

  static formatCurrency(amount, currency = 'USDC') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount).replace('USD', currency);
  }
}

module.exports = Helpers;