const { InvoiceProcessor } = require('./invoiceProcessor');

class InvoiceParser {
  constructor() {
    this.processor = new InvoiceProcessor();
  }

  /**
   * Main function to parse invoice files
   * @param {Buffer} fileBuffer - The invoice file buffer
   * @param {string} fileType - File type: 'pdf', 'jpg', 'png', 'jpeg'
   * @returns {Object} Parsed payment intent
   */
  async parseInvoice(fileBuffer, fileType) {
    try {
      console.log(`Processing ${fileType} invoice...`);
      
      const result = await this.processor.processInvoice(fileBuffer, fileType);
      
      if (result.success) {
        console.log('Invoice parsed successfully:', {
          payer: result.data.payer,
          amount: result.data.amounts[0],
          purpose: result.data.purpose,
          confidence: result.data.confidence
        });
      } else {
        console.warn('Invoice parsing failed:', result.error);
      }
      
      return result;
      
    } catch (error) {
      console.error('Error in invoice parser:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Process multiple invoices
   * @param {Array} invoices - Array of {buffer, fileType} objects
   * @returns {Array} Results for all invoices
   */
  async parseMultipleInvoices(invoices) {
    const results = [];
    
    for (const invoice of invoices) {
      const result = await this.parseInvoice(invoice.buffer, invoice.fileType);
      results.push(result);
    }
    
    return results;
  }

  async cleanup() {
    await this.processor.cleanup();
  }
}

// Export singleton instance
module.exports = new InvoiceParser();