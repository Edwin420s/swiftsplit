// src/services/aiService.js
const axios = require('axios');
const FormData = require('form-data');
const AILog = require('../models/AILog');
const ParsedInvoice = require('../models/ParsedInvoice');
const ChatMessage = require('../models/ChatMessage');
const { v4: uuidv4 } = require('uuid');

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

  async parseInvoice(invoiceFile, userId = null) {
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
        userId,
        inputType: 'invoice',
        inputData: { 
          filename: invoiceFile.originalname, 
          mimetype: invoiceFile.mimetype,
          size: invoiceFile.size
        },
        rawText: parsedData.rawText || '',
        parsedOutput: {
          payer: parsedData.payer,
          payerWallet: parsedData.payerWallet,
          recipients: parsedData.recipients || [],
          amounts: parsedData.amounts || [],
          currency: parsedData.currency || 'USDC',
          purpose: parsedData.purpose || '',
          splits: parsedData.splits || []
        },
        confidence: response.data.validation?.confidence || 0.9,
        status: 'verified',
        metadata: response.data.metadata || {}
      });
      await aiLog.save();

      // Create ParsedInvoice record
      const invoiceId = `INV-${Date.now()}-${uuidv4().slice(0, 8)}`;
      const parsedInvoice = new ParsedInvoice({
        userId,
        invoiceId,
        originalFileName: invoiceFile.originalname,
        fileUrl: `/uploads/${invoiceFile.filename}`,
        parsedData: {
          invoiceNumber: parsedData.invoiceNumber,
          issueDate: parsedData.issueDate,
          dueDate: parsedData.dueDate,
          payer: parsedData.payer,
          recipients: parsedData.recipients,
          totalAmount: parsedData.totalAmount || parsedData.amounts.reduce((a, b) => a + b, 0),
          currency: parsedData.currency || 'USDC',
          items: parsedData.items || [],
          notes: parsedData.notes || ''
        },
        verificationStatus: 'verified',
        aiConfidence: response.data.validation?.confidence || 0.9,
        aiLogId: aiLog._id,
        metadata: {
          mimeType: invoiceFile.mimetype,
          fileSize: invoiceFile.size,
          processedAt: new Date(),
          ocrEngine: response.data.metadata?.ocrEngine || 'tesseract',
          nlpModel: response.data.metadata?.nlpModel || 'gpt-4'
        }
      });
      await parsedInvoice.save();

      return {
        success: true,
        data: parsedData,
        invoiceId,
        logId: aiLog._id
      };
    } catch (error) {
      console.error('AI invoice parsing error:', error.message);
      
      // Fallback to mock if AI modules are unavailable
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        console.warn('AI Modules unavailable, using fallback mock parsing');
        return await this.mockInvoiceParsing(invoiceFile, userId);
      }
      
      return { success: false, error: error.message };
    }
  }

  async parseChatMessage(message, userId = null, conversationId = null) {
    try {
      // Call AI Modules service
      const response = await this.aiModulesClient.post('/api/parse/chat', {
        message,
        userId,
        conversationId
      });

      const parsedData = response.data.data;
      const intent = response.data.intent || 'unknown';
      
      // Log to MongoDB
      const aiLog = new AILog({
        userId,
        inputType: 'chat',
        inputData: { message, conversationId },
        rawText: message,
        parsedOutput: {
          payer: parsedData.payer,
          payerWallet: parsedData.payerWallet,
          recipients: parsedData.recipients || [],
          amounts: parsedData.amounts || [],
          currency: parsedData.currency || 'USDC',
          purpose: parsedData.purpose || '',
          splits: parsedData.splits || []
        },
        confidence: response.data.validation?.confidence || 0.85,
        status: 'verified',
        metadata: { intent }
      });
      await aiLog.save();

      // Save chat message
      const chatMessage = new ChatMessage({
        conversationId: conversationId || `conv_${userId}_${Date.now()}`,
        userId,
        role: 'user',
        message,
        intent,
        parsedData,
        aiLogId: aiLog._id
      });
      await chatMessage.save();

      return {
        success: true,
        data: parsedData,
        intent,
        conversationId: chatMessage.conversationId,
        logId: aiLog._id
      };
    } catch (error) {
      console.error('AI chat parsing error:', error.message);
      
      // Fallback to mock if AI modules are unavailable
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        console.warn('AI Modules unavailable, using fallback mock parsing');
        return await this.mockChatParsing(message, userId, conversationId);
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
  async mockInvoiceParsing(invoiceFile, userId = null) {
    console.warn('Using mock invoice parsing - AI Modules unavailable');
    const parsedData = {
      payer: "client_placeholder",
      payerWallet: null,
      recipients: [{ name: "freelancer_placeholder", wallet: null }],
      amounts: [100],
      currency: "USDC",
      purpose: "Invoice payment (mock data)",
      splits: []
    };

    const aiLog = new AILog({
      userId,
      inputType: 'invoice',
      inputData: { filename: invoiceFile.originalname, mock: true },
      parsedOutput: parsedData,
      confidence: 0.5,
      isMock: true,
      status: 'parsed'
    });
    await aiLog.save();

    const invoiceId = `INV-MOCK-${Date.now()}`;
    const parsedInvoice = new ParsedInvoice({
      userId,
      invoiceId,
      originalFileName: invoiceFile.originalname,
      parsedData: {
        totalAmount: 100,
        currency: 'USDC',
        payer: parsedData.payer,
        recipients: parsedData.recipients
      },
      verificationStatus: 'pending',
      aiConfidence: 0.5,
      aiLogId: aiLog._id,
      metadata: {
        mimeType: invoiceFile.mimetype,
        processedAt: new Date()
      }
    });
    await parsedInvoice.save();

    return {
      success: true,
      data: parsedData,
      invoiceId,
      logId: aiLog._id,
      isMock: true
    };
  }

  async mockChatParsing(message, userId = null, conversationId = null) {
    console.warn('Using mock chat parsing - AI Modules unavailable');
    const amountMatch = message.match(/\$?(\d+(?:\.\d{2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 100;
    
    const parsedData = {
      payer: "payer_placeholder",
      payerWallet: null,
      recipients: [{ name: "recipient_placeholder", wallet: null }],
      amounts: [amount],
      currency: "USDC",
      purpose: "Chat payment (mock data)",
      splits: []
    };

    const aiLog = new AILog({
      userId,
      inputType: 'chat',
      inputData: { message, mock: true },
      rawText: message,
      parsedOutput: parsedData,
      confidence: 0.5,
      isMock: true,
      status: 'parsed'
    });
    await aiLog.save();

    const chatMessage = new ChatMessage({
      conversationId: conversationId || `conv_${userId}_${Date.now()}`,
      userId,
      role: 'user',
      message,
      intent: 'payment_request',
      parsedData,
      aiLogId: aiLog._id
    });
    await chatMessage.save();
    
    return {
      success: true,
      data: parsedData,
      intent: 'payment_request',
      conversationId: chatMessage.conversationId,
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