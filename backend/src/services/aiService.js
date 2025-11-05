// src/services/aiService.js
const axios = require('axios');
const FormData = require('form-data');
const AILog = require('../models/AILog');

const AI_MODULES_URL = process.env.AI_MODULES_URL || 'http://localhost:3001';

class AIService {
  constructor() {
    this.aiModulesClient = axios.create({
      baseURL: AI_MODULES_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async parseInvoice(invoiceFile) {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('invoice', invoiceFile.buffer, {
        filename: invoiceFile.originalname,
        contentType: invoiceFile.mimetype
      });

      // Call AI Modules service
      const response = await this.aiModulesClient.post('/api/parse/invoice', formData, {
        headers: formData.getHeaders()
      });

      const parsedData = response.data.data;
      
      // Log to MongoDB
      const aiLog = new AILog({
        inputType: 'invoice',
        inputData: { filename: invoiceFile.originalname, mimetype: invoiceFile.mimetype },
        parsedOutput: parsedData,
        confidence: response.data.validation?.confidence || 0.9
      });
      await aiLog.save();

      return {
        success: true,
        data: parsedData,
        logId: aiLog._id
      };
    } catch (error) {
      console.error('AI invoice parsing error:', error.message);
      
      // Fallback to mock if AI modules are unavailable
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        console.warn('AI Modules unavailable, using fallback mock parsing');
        return await this.mockInvoiceParsing(invoiceFile);
      }
      
      return { success: false, error: error.message };
    }
  }

  async parseChatMessage(message, sender = 'Client') {
    try {
      // Call AI Modules service
      const response = await this.aiModulesClient.post('/api/parse/chat', {
        message,
        sender
      });

      const parsedData = response.data.data;
      
      // Log to MongoDB
      const aiLog = new AILog({
        inputType: 'chat',
        inputData: { message, sender },
        parsedOutput: parsedData,
        confidence: response.data.validation?.confidence || 0.85
      });
      await aiLog.save();

      return {
        success: true,
        data: parsedData,
        logId: aiLog._id
      };
    } catch (error) {
      console.error('AI chat parsing error:', error.message);
      
      // Fallback to mock if AI modules are unavailable
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        console.warn('AI Modules unavailable, using fallback mock parsing');
        return await this.mockChatParsing(message, sender);
      }
      
      return { success: false, error: error.message };
    }
  }

  async parseVoiceCommand(audioBuffer, contentType, sender = 'Client') {
    try {
      const formData = new FormData();
      formData.append('audio', audioBuffer, {
        filename: 'voice.webm',
        contentType: contentType
      });
      formData.append('sender', sender);

      const response = await this.aiModulesClient.post('/api/parse/voice', formData, {
        headers: formData.getHeaders()
      });

      const parsedData = response.data.data;
      
      // Log to MongoDB
      const aiLog = new AILog({
        inputType: 'voice',
        inputData: { contentType, sender },
        parsedOutput: parsedData,
        confidence: response.data.validation?.confidence || 0.8
      });
      await aiLog.save();

      return {
        success: true,
        data: parsedData,
        logId: aiLog._id
      };
    } catch (error) {
      console.error('AI voice parsing error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Fallback mock methods when AI modules are unavailable
  async mockInvoiceParsing(invoiceFile) {
    console.warn('Using mock invoice parsing - AI Modules unavailable');
    const parsedData = {
      payer: "client_placeholder",
      recipients: ["freelancer_placeholder"],
      amounts: [100],
      currency: "USDC",
      purpose: "Invoice payment (mock data)"
    };

    const aiLog = new AILog({
      inputType: 'invoice',
      inputData: { filename: invoiceFile.originalname, mock: true },
      parsedOutput: parsedData,
      confidence: 0.5
    });
    await aiLog.save();

    return {
      success: true,
      data: parsedData,
      logId: aiLog._id,
      isMock: true
    };
  }

  async mockChatParsing(message, sender = 'Client') {
    console.warn('Using mock chat parsing - AI Modules unavailable');
    const amountMatch = message.match(/\$?(\d+(?:\.\d{2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 100;
    
    const parsedData = {
      payer: sender,
      recipients: ["recipient_placeholder"],
      amounts: [amount],
      currency: "USDC",
      purpose: "Chat payment (mock data)"
    };

    const aiLog = new AILog({
      inputType: 'chat',
      inputData: { message, sender, mock: true },
      parsedOutput: parsedData,
      confidence: 0.5
    });
    await aiLog.save();
    
    return {
      success: true,
      data: parsedData,
      logId: aiLog._id,
      isMock: true
    };
  }

  async checkHealth() {
    try {
      const response = await this.aiModulesClient.get('/health');
      return {
        available: true,
        status: response.data
      };
    } catch (error) {
      return {
        available: false,
        error: error.message
      };
    }
  }
}

module.exports = new AIService();