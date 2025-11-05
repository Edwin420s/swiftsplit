// src/services/aiService.js
const AILog = require('../models/AILog');

class AIService {
  async parseInvoice(invoiceFile) {
    try {
      // Mock AI processing - replace with actual OCR/NLP service
      const parsedData = await this.mockInvoiceParsing(invoiceFile);
      
      // Log to MongoDB
      const aiLog = new AILog({
        inputType: 'invoice',
        inputData: { filename: invoiceFile.originalname },
        parsedOutput: parsedData,
        confidence: 0.92
      });
      await aiLog.save();

      return {
        success: true,
        data: parsedData,
        logId: aiLog._id
      };
    } catch (error) {
      console.error('AI parsing error:', error);
      return { success: false, error: error.message };
    }
  }

  async parseChatMessage(message) {
    try {
      const parsedData = await this.mockChatParsing(message);
      
      const aiLog = new AILog({
        inputType: 'chat',
        inputData: { message },
        parsedOutput: parsedData,
        confidence: 0.88
      });
      await aiLog.save();

      return {
        success: true,
        data: parsedData,
        logId: aiLog._id
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async mockInvoiceParsing(invoiceFile) {
    // Replace with actual OCR + NLP processing
    return {
      payer: "client_123",
      recipients: ["freelancer_456"],
      amounts: [120],
      currency: "USDC",
      purpose: "Website development project"
    };
  }

  async mockChatParsing(message) {
    // Replace with actual NLP processing
    const amountMatch = message.match(/\$?(\d+(?:\.\d{2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    
    return {
      payer: "client_123",
      recipients: ["freelancer_456"],
      amounts: [amount],
      currency: "USDC",
      purpose: "Payment request via chat"
    };
  }
}

module.exports = new AIService();