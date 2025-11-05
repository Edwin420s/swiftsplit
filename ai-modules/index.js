const invoiceParser = require('./invoice-parser/parseInvoice');
const chatParser = require('./chat-parser/parseChat');
const voiceParser = require('./voice-parser/parseVoice');
const { PaymentValidator } = require('./shared/validationEngine');

class SwiftSplitAI {
  constructor() {
    this.validators = new PaymentValidator();
    this.initialized = false;
  }

  async initialize() {
    try {
      console.log('Initializing SwiftSplit AI modules...');
      
      // Initialize any async components
      await this.validators.loadRiskPatterns();
      
      this.initialized = true;
      console.log('SwiftSplit AI modules ready');
      
    } catch (error) {
      console.error('Failed to initialize AI modules:', error);
      throw error;
    }
  }

  /**
   * Main method to parse any payment input
   * @param {Object} input - The input to parse
   * @param {string} type - 'invoice', 'chat', or 'voice'
   * @returns {Object} Parsed payment intent with validation
   */
  async parsePayment(input, type) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      let result;

      switch (type) {
        case 'invoice':
          result = await invoiceParser.parseInvoice(input.buffer, input.fileType);
          break;
        case 'chat':
          result = await chatParser.parseChatMessage(input.text, input.sender);
          break;
        case 'voice':
          result = await voiceParser.parseVoiceCommand(
            input.audio, 
            input.contentType, 
            input.sender
          );
          break;
        default:
          throw new Error(`Unsupported input type: ${type}`);
      }

      // Validate the parsed result
      if (result.success) {
        const validation = await this.validators.validatePayment(result.data);
        result.validation = validation;
        
        if (!validation.isValid) {
          result.success = false;
          result.error = validation.issues.join(', ');
        }
      }

      return result;

    } catch (error) {
      console.error(`Error parsing ${type} input:`, error);
      return {
        success: false,
        error: error.message,
        type: type,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Batch process multiple inputs
   */
  async batchParse(inputs) {
    const results = [];
    
    for (const input of inputs) {
      const result = await this.parsePayment(input.data, input.type);
      results.push({
        id: input.id,
        type: input.type,
        ...result
      });
    }
    
    return results;
  }

  /**
   * Get AI module status and health
   */
  getStatus() {
    return {
      initialized: this.initialized,
      modules: {
        invoice: 'active',
        chat: 'active',
        voice: 'active',
        validation: 'active'
      },
      timestamp: new Date().toISOString()
    };
  }

  async cleanup() {
    await invoiceParser.cleanup();
    this.initialized = false;
    console.log('SwiftSplit AI modules cleaned up');
  }
}

// Export singleton instance
module.exports = new SwiftSplitAI();