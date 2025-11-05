const express = require('express');
const multer = require('multer');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const swiftSplitAI = require('./index');
const configManager = require('./shared/configManager');
const { ErrorHandler } = require('./shared/errorHandler');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: configManager.get('ai.maxFileSize')
  }
});

// Swagger documentation
const swaggerDocument = YAML.load('./docs/swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'SwiftSplit AI Modules',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    aiStatus: swiftSplitAI.getStatus()
  });
});

// Parse invoice endpoint
app.post('/api/parse/invoice', upload.single('invoice'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No invoice file provided'
      });
    }

    const result = await swiftSplitAI.parsePayment(
      {
        buffer: req.file.buffer,
        fileType: req.file.mimetype.split('/')[1] || 'pdf'
      },
      'invoice'
    );

    res.json(result);

  } catch (error) {
    const errorInfo = ErrorHandler.handle(error, { endpoint: '/api/parse/invoice' });
    res.status(500).json({
      success: false,
      error: errorInfo.message,
      code: errorInfo.code
    });
  }
});

// Parse chat message endpoint
app.post('/api/parse/chat', async (req, res) => {
  try {
    const { message, sender = 'User' } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'No message provided'
      });
    }

    const result = await swiftSplitAI.parsePayment(
      { text: message, sender },
      'chat'
    );

    res.json(result);

  } catch (error) {
    const errorInfo = ErrorHandler.handle(error, { endpoint: '/api/parse/chat' });
    res.status(500).json({
      success: false,
      error: errorInfo.message,
      code: errorInfo.code
    });
  }
});

// Parse voice command endpoint
app.post('/api/parse/voice', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided'
      });
    }

    const result = await swiftSplitAI.parsePayment(
      {
        audio: req.file.buffer,
        contentType: req.file.mimetype,
        sender: req.body.sender || 'User'
      },
      'voice'
    );

    res.json(result);

  } catch (error) {
    const errorInfo = ErrorHandler.handle(error, { endpoint: '/api/parse/voice' });
    res.status(500).json({
      success: false,
      error: errorInfo.message,
      code: errorInfo.code
    });
  }
});

// Batch processing endpoint
app.post('/api/parse/batch', async (req, res) => {
  try {
    const { inputs } = req.body;

    if (!Array.isArray(inputs)) {
      return res.status(400).json({
        success: false,
        error: 'Inputs must be an array'
      });
    }

    const results = await swiftSplitAI.batchParse(inputs);
    res.json({ success: true, results });

  } catch (error) {
    const errorInfo = ErrorHandler.handle(error, { endpoint: '/api/parse/batch' });
    res.status(500).json({
      success: false,
      error: errorInfo.message,
      code: errorInfo.code
    });
  }
});

// Configuration endpoint (read-only)
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    config: configManager.getEnvironmentConfig(),
    environment: configManager.environment
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  const errorInfo = ErrorHandler.handle(error, { 
    path: req.path, 
    method: req.method 
  });
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    reference: errorInfo.timestamp
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`
  });
});

// Start server
async function startServer() {
  try {
    await swiftSplitAI.initialize();
    configManager.loadFromEnvironment();
    
    const configValidation = configManager.validate();
    if (!configValidation.isValid) {
      console.warn('Configuration issues:', configValidation.issues);
    }

    app.listen(PORT, () => {
      console.log(`SwiftSplit AI Modules API running on port ${PORT}`);
      console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`Health Check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await swiftSplitAI.cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await swiftSplitAI.cleanup();
  process.exit(0);
});

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = app;