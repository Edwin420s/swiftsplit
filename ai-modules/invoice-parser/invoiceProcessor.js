const { createWorker } = require('tesseract.js');
const pdfParse = require('pdf-parse');
const sharp = require('sharp');
const { AI_CONFIG, PaymentValidators } = require('../shared');

class InvoiceProcessor {
  constructor() {
    this.worker = null;
    this.initializeWorker();
  }

  async initializeWorker() {
    this.worker = await createWorker('eng');
  }

  async processInvoice(fileBuffer, fileType) {
    try {
      let extractedText;
      
      if (fileType === 'pdf') {
        extractedText = await this.extractFromPDF(fileBuffer);
      } else if (['jpg', 'jpeg', 'png'].includes(fileType)) {
        extractedText = await this.extractFromImage(fileBuffer);
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }

      const paymentIntent = await this.parseInvoiceText(extractedText);
      return {
        success: true,
        data: paymentIntent,
        rawText: extractedText
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        rawText: null
      };
    }
  }

  async extractFromPDF(pdfBuffer) {
    const data = await pdfParse(pdfBuffer);
    return data.text;
  }

  async extractFromImage(imageBuffer) {
    // Preprocess image for better OCR
    const processedImage = await sharp(imageBuffer)
      .grayscale()
      .normalize()
      .sharpen()
      .toBuffer();

    const { data: { text } } = await this.worker.recognize(processedImage);
    return text;
  }

  async parseInvoiceText(text) {
    // Extract basic invoice information
    const lines = text.split('\n').filter(line => line.trim());
    
    const payer = this.extractPayer(lines);
    const recipient = this.extractRecipient(lines);
    const amount = this.extractAmount(lines);
    const purpose = this.extractPurpose(lines, text);

    const paymentIntent = {
      payer: payer || 'Client',
      recipients: [{ name: recipient || 'Freelancer', wallet: null }],
      amounts: [amount],
      currency: 'USDC',
      purpose: purpose || 'Professional services',
      confidence: this.calculateConfidence(lines, amount),
      source: 'invoice'
    };

    PaymentValidators.validatePaymentIntent(paymentIntent);
    return paymentIntent;
  }

  extractPayer(lines) {
    // Look for "From:", "Bill From:", "Client:" patterns
    const payerPatterns = [/from:\s*(.+)/i, /bill from:\s*(.+)/i, /client:\s*(.+)/i];
    
    for (const line of lines) {
      for (const pattern of payerPatterns) {
        const match = line.match(pattern);
        if (match) return match[1].trim();
      }
    }
    return null;
  }

  extractRecipient(lines) {
    // Look for "To:", "Bill To:", "Pay To:" patterns
    const recipientPatterns = [/to:\s*(.+)/i, /bill to:\s*(.+)/i, /pay to:\s*(.+)/i];
    
    for (const line of lines) {
      for (const pattern of recipientPatterns) {
        const match = line.match(pattern);
        if (match) return match[1].trim();
      }
    }
    return null;
  }

  extractAmount(lines) {
    // Look for amount patterns like $120, USD 120, Total: 120
    const amountPatterns = [
      /total\s*[:\s]+\$?(\d+\.?\d*)/i,
      /amount\s*[:\s]+\$?(\d+\.?\d*)/i,
      /\$(\d+\.?\d*)/,
      /usd\s*(\d+\.?\d*)/i
    ];
    
    for (const line of lines) {
      for (const pattern of amountPatterns) {
        const match = line.match(pattern);
        if (match) {
          const amount = parseFloat(match[1]);
          if (!isNaN(amount) && amount > 0) {
            return PaymentValidators.validateAmount(amount);
          }
        }
      }
    }
    throw new Error('No valid amount found in invoice');
  }

  extractPurpose(lines, fullText) {
    // Look for description, purpose, or service details
    const purposePatterns = [
      /description\s*[:\s]*(.+)/i,
      /purpose\s*[:\s]*(.+)/i,
      /service\s*[:\s]*(.+)/i,
      /for\s*[:\s]*(.+)/i
    ];
    
    for (const line of lines) {
      for (const pattern of purposePatterns) {
        const match = line.match(pattern);
        if (match) {
          const purpose = match[1].trim();
          // Check if purpose contains known payment purposes
          const knownPurpose = AI_CONFIG.PAYMENT_PURPOSES.find(p => 
            purpose.toLowerCase().includes(p)
          );
          return knownPurpose || purpose;
        }
      }
    }
    return 'Professional services';
  }

  calculateConfidence(lines, amount) {
    let confidence = 0.5; // Base confidence
    
    if (amount) confidence += 0.3;
    if (lines.length > 5) confidence += 0.1;
    if (lines.some(line => line.toLowerCase().includes('invoice'))) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
    }
  }
}

module.exports = { InvoiceProcessor };