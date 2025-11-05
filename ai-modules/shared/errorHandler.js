class AIError extends Error {
  constructor(message, code, module, details = {}) {
    super(message);
    this.name = 'AIError';
    this.code = code;
    this.module = module;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      module: this.module,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

class ErrorHandler {
  static handle(error, context = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      module: error.module || 'unknown'
    };

    // Log error based on type
    if (error.code) {
      switch (error.code) {
        case 'PARSE_ERROR':
          console.warn('Parse error:', errorInfo);
          break;
        case 'VALIDATION_ERROR':
          console.warn('Validation error:', errorInfo);
          break;
        case 'CONFIG_ERROR':
          console.error('Configuration error:', errorInfo);
          break;
        default:
          console.error('Unknown error:', errorInfo);
      }
    } else {
      console.error('Unexpected error:', errorInfo);
    }

    return errorInfo;
  }

  static createError(message, code, module, details) {
    return new AIError(message, code, module, details);
  }

  static async withRetry(operation, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
          await this.delay(delay * attempt); // Exponential backoff
        }
      }
    }
    
    throw lastError;
  }

  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { AIError, ErrorHandler };