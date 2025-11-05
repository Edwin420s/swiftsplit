class ConfigManager {
  constructor() {
    this.config = {
      ai: {
        minConfidence: 0.85,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        timeout: 30000, // 30 seconds
        retryAttempts: 3
      },
      risk: {
        autoApproveThreshold: 50,
        highRiskThreshold: 75,
        reviewRequiredThreshold: 50
      },
      processing: {
        batchSize: 10,
        concurrentProcesses: 3,
        cacheDuration: 300000 // 5 minutes
      }
    };
    
    this.environment = process.env.NODE_ENV || 'development';
  }

  get(keyPath, defaultValue = null) {
    const keys = keyPath.split('.');
    let value = this.config;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  }

  set(keyPath, value) {
    const keys = keyPath.split('.');
    let current = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  loadFromEnvironment() {
    // Load configuration from environment variables
    if (process.env.AI_MIN_CONFIDENCE) {
      this.set('ai.minConfidence', parseFloat(process.env.AI_MIN_CONFIDENCE));
    }
    
    if (process.env.RISK_AUTO_APPROVE_THRESHOLD) {
      this.set('risk.autoApproveThreshold', parseInt(process.env.RISK_AUTO_APPROVE_THRESHOLD));
    }
    
    if (process.env.AI_TIMEOUT) {
      this.set('ai.timeout', parseInt(process.env.AI_TIMEOUT));
    }
    
    console.log('Configuration loaded for environment:', this.environment);
  }

  validate() {
    const issues = [];
    
    if (this.get('ai.minConfidence') < 0 || this.get('ai.minConfidence') > 1) {
      issues.push('AI min confidence must be between 0 and 1');
    }
    
    if (this.get('risk.autoApproveThreshold') < 0 || this.get('risk.autoApproveThreshold') > 100) {
      issues.push('Risk auto-approve threshold must be between 0 and 100');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  getEnvironmentConfig() {
    const baseConfig = { ...this.config };
    
    if (this.environment === 'production') {
      baseConfig.ai.retryAttempts = 5;
      baseConfig.processing.concurrentProcesses = 5;
    } else if (this.environment === 'test') {
      baseConfig.ai.retryAttempts = 1;
      baseConfig.ai.timeout = 5000;
    }
    
    return baseConfig;
  }
}

module.exports = new ConfigManager();