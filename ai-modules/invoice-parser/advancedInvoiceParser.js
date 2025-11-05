const { createWorker } = require('tesseract.js');
const pdfParse = require('pdf-parse');
const sharp = require('sharp');
const { ErrorHandler } = require('../shared/errorHandler');

class AdvancedInvoiceParser {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('Initializing Advanced Invoice Parser...');
      
      this.worker = await createWorker('eng', 1, {
        logger: m => console.log('OCR Progress:', m.progress)
      });
      
      await this.worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz$€£.,/- ()@:',
        preserve_interword_spaces: '1'
      });
      
      this.isInitialized = true;
      console.log('Advanced Invoice Parser ready');
      
    } catch (error) {
      throw ErrorHandler.createError(
        'Failed to initialize invoice parser',
        'INIT_ERROR',
        'invoice-parser',
        { originalError: error.message }
      );
    }
  }

  async parseInvoiceAdvanced(fileBuffer, fileType, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const extractionResult = await this.extractText(fileBuffer, fileType, options);
      const parsedData = await this.analyzeInvoiceStructure(extractionResult.text);
      const paymentIntent = await this.buildPaymentIntent(parsedData, extractionResult);
      
      return {
        success: true,
        data: paymentIntent,
        metadata: {
          extractionMethod: extractionResult.method,
          processingTime: extractionResult.processingTime,
          wordCount: extractionResult.text.split(/\s+/).length
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorCode: error.code,
        module: 'advanced-invoice-parser'
      };
    }
  }

  async extractText(fileBuffer, fileType, options) {
    const startTime = Date.now();
    let text, method;

    try {
      if (fileType === 'pdf') {
        text = await this.extractFromPDF(fileBuffer, options);
        method = 'pdf-parse';
      } else if (['jpg', 'jpeg', 'png', 'tiff'].includes(fileType)) {
        text = await this.extractFromImageWithOCR(fileBuffer, options);
        method = 'tesseract-ocr';
      } else {
        throw ErrorHandler.createError(
          `Unsupported file type: ${fileType}`,
          'UNSUPPORTED_FORMAT',
          'invoice-parser'
        );
      }

      const processingTime = Date.now() - startTime;
      
      return {
        text: text || '',
        method,
        processingTime,
        success: !!text
      };
      
    } catch (error) {
      throw ErrorHandler.createError(
        `Text extraction failed: ${error.message}`,
        'EXTRACTION_ERROR',
        'invoice-parser',
        { fileType, originalError: error.message }
      );
    }
  }

  async extractFromPDF(pdfBuffer, options) {
    try {
      const data = await pdfParse(pdfBuffer, {
        pagerender: options.renderPage || undefined,
        max: options.maxPages || 10
      });
      
      return data.text;
    } catch (error) {
      // Fallback: Try OCR on PDF if text extraction fails
      console.warn('PDF text extraction failed, trying OCR fallback...');
      return await this.extractFromImageWithOCR(pdfBuffer, { ...options, isPDF: true });
    }
  }

  async extractFromImageWithOCR(imageBuffer, options) {
    try {
      // Preprocess image for better OCR
      let processedImage = sharp(imageBuffer);
      
      if (options.enhanceContrast) {
        processedImage = processedImage.normalize();
      }
      
      if (options.removeNoise) {
        processedImage = processedImage.median(3);
      }
      
      if (options.grayscale) {
        processedImage = processedImage.grayscale();
      }
      
      const processedBuffer = await processedImage
        .sharpen()
        .ensureAlpha()
        .toBuffer();

      const { data: { text } } = await this.worker.recognize(processedBuffer);
      return text;
      
    } catch (error) {
      throw ErrorHandler.createError(
        `OCR processing failed: ${error.message}`,
        'OCR_ERROR',
        'invoice-parser'
      );
    }
  }

  async analyzeInvoiceStructure(text) {
    const lines = text.split('\n').filter(line => line.trim());
    const sections = this.identifySections(lines);
    
    return {
      header: this.extractHeader(sections.header || lines.slice(0, 10)),
      recipient: this.extractRecipient(sections.recipient || lines),
      payer: this.extractPayer(sections.payer || lines),
      items: this.extractLineItems(sections.items || lines),
      totals: this.extractTotals(sections.totals || lines),
      metadata: this.extractMetadata(lines)
    };
  }

  identifySections(lines) {
    const sections = {};
    let currentSection = 'header';
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.includes('bill to') || lowerLine.includes('ship to')) {
        currentSection = 'recipient';
      } else if (lowerLine.includes('from') || lowerLine.includes('vendor')) {
        currentSection = 'payer';
      } else if (lowerLine.includes('description') || lowerLine.includes('item')) {
        currentSection = 'items';
      } else if (lowerLine.includes('total') || lowerLine.includes('amount due')) {
        currentSection = 'totals';
      }
      
      if (!sections[currentSection]) {
        sections[currentSection] = [];
      }
      sections[currentSection].push(line);
    }
    
    return sections;
  }

  extractHeader(headerLines) {
    // Extract invoice number, date, etc.
    const header = {};
    
    for (const line of headerLines) {
      // Look for invoice number
      const invoiceMatch = line.match(/invoice\s*(?:#|no|number)?\s*:?\s*([a-z0-9\-]+)/i);
      if (invoiceMatch) header.invoiceNumber = invoiceMatch[1];
      
      // Look for date
      const dateMatch = line.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
      if (dateMatch) header.date = dateMatch[1];
    }
    
    return header;
  }

  extractLineItems(itemLines) {
    const items = [];
    const itemPattern = /^(.+?)\s+(\d+)\s*\$?(\d+\.?\d*)/i;
    
    for (const line of itemLines) {
      const match = line.match(itemPattern);
      if (match) {
        items.push({
          description: match[1].trim(),
          quantity: parseInt(match[2]) || 1,
          price: parseFloat(match[3])
        });
      }
    }
    
    return items;
  }

  async buildPaymentIntent(parsedData, extractionResult) {
    const totals = parsedData.totals || [];
    const amount = this.extractAmountFromTotals(totals);
    const items = parsedData.items || [];
    
    const paymentIntent = {
      payer: parsedData.payer ? this.cleanName(parsedData.payer[0]) : 'Client',
      recipients: [{
        name: parsedData.recipient ? this.cleanName(parsedData.recipient[0]) : 'Vendor',
        wallet: null
      }],
      amounts: [amount],
      currency: 'USDC',
      purpose: this.determinePurpose(items),
      confidence: this.calculateAdvancedConfidence(parsedData, extractionResult),
      source: 'invoice',
      metadata: {
        invoiceNumber: parsedData.header?.invoiceNumber,
        invoiceDate: parsedData.header?.date,
        lineItems: items,
        extractionQuality: this.assessExtractionQuality(extractionResult.text)
      }
    };
    
    return paymentIntent;
  }

  extractAmountFromTotals(totals) {
    // Look for total amount in various formats
    const amountPatterns = [
      /total\s*[:\s]+\$?(\d+\.?\d*)/i,
      /amount\s*(?:due)?\s*[:\s]+\$?(\d+\.?\d*)/i,
      /balance\s*(?:due)?\s*[:\s]+\$?(\d+\.?\d*)/i,
      /\$(\d+\.?\d*)\s*(?!.*\$\d+\.?\d*)/ // Last dollar amount
    ];
    
    for (const line of totals) {
      for (const pattern of amountPatterns) {
        const match = line.match(pattern);
        if (match) {
          const amount = parseFloat(match[1]);
          if (!isNaN(amount) && amount > 0) {
            return amount;
          }
        }
      }
    }
    
    throw ErrorHandler.createError(
      'Could not determine invoice amount',
      'AMOUNT_NOT_FOUND',
      'invoice-parser'
    );
  }

  determinePurpose(items) {
    if (items.length === 0) return 'Professional services';
    
    const descriptions = items.map(item => item.description.toLowerCase());
    
    // Look for common service types
    const serviceTypes = [
      'design', 'development', 'consulting', 'writing', 
      'marketing', 'support', 'maintenance'
    ];
    
    for (const service of serviceTypes) {
      if (descriptions.some(desc => desc.includes(service))) {
        return service.charAt(0).toUpperCase() + service.slice(1);
      }
    }
    
    return items[0].description || 'Professional services';
  }

  calculateAdvancedConfidence(parsedData, extractionResult) {
    let confidence = 0.5;
    
    // Points for successful extraction
    if (extractionResult.text.length > 100) confidence += 0.2;
    
    // Points for structured data found
    if (parsedData.header?.invoiceNumber) confidence += 0.1;
    if (parsedData.items?.length > 0) confidence += 0.1;
    if (parsedData.totals?.length > 0) confidence += 0.1;
    
    // Points for clear amount
    try {
      this.extractAmountFromTotals(parsedData.totals || []);
      confidence += 0.1;
    } catch (e) {
      confidence -= 0.2;
    }
    
    return Math.min(confidence, 1.0);
  }

  assessExtractionQuality(text) {
    const wordCount = text.split(/\s+/).length;
    const lineCount = text.split('\n').length;
    
    if (wordCount > 200) return 'high';
    if (wordCount > 50) return 'medium';
    return 'low';
  }

  cleanName(name) {
    return name
      .replace(/[^a-zA-Z0-9\s\-&]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100);
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.isInitialized = false;
    }
  }
}

module.exports = { AdvancedInvoiceParser };