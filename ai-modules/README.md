# SwiftSplit AI Modules

AI-powered payment intent parsing for invoices, chat messages, and voice commands. Built for the SwiftSplit cross-border freelance payment platform.

## Overview

This module extracts payment information from:
- **Invoices** (PDF/images) using OCR and NLP
- **Chat messages** using natural language understanding
- **Voice commands** using speech-to-text + intent detection

## Features

- **Invoice Parser**: Extracts payer, recipient, amount, and purpose from PDF/image invoices
- **Chat Parser**: Understands natural language payment requests like "Pay John $120 for website"
- **Voice Parser**: Processes voice commands for hands-free payments
- **Risk Validation**: Automated risk scoring and fraud detection
- **Batch Processing**: Handle multiple requests simultaneously
- **Clean API**: RESTful endpoints for easy integration

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start the Server

```bash
npm start
```

The API will be available at `http://localhost:3001`

### 4. Test the Health Endpoint

```bash
curl http://localhost:3001/health
```

## API Endpoints

### Parse Invoice
```bash
POST /api/parse/invoice
Content-Type: multipart/form-data

# Upload an invoice file (PDF, JPG, PNG)
curl -X POST http://localhost:3001/api/parse/invoice \
  -F "invoice=@/path/to/invoice.pdf"
```

### Parse Chat Message
```bash
POST /api/parse/chat
Content-Type: application/json

{
  "message": "Pay John $120 for the website",
  "sender": "Client"
}
```

### Parse Voice Command
```bash
POST /api/parse/voice
Content-Type: multipart/form-data

# Upload an audio file (MP3, WAV)
curl -X POST http://localhost:3001/api/parse/voice \
  -F "audio=@/path/to/command.mp3" \
  -F "sender=Client"
```

### Batch Processing
```bash
POST /api/parse/batch
Content-Type: application/json

{
  "inputs": [
    {
      "id": "req-1",
      "type": "chat",
      "data": {
        "text": "Pay Jane $500",
        "sender": "Client"
      }
    },
    {
      "id": "req-2",
      "type": "chat",
      "data": {
        "text": "Split $1000 between Alex and Maria",
        "sender": "Manager"
      }
    }
  ]
}
```

### Get Configuration
```bash
GET /api/config
```

### Health Check
```bash
GET /health
```

## Response Format

All endpoints return JSON with the following structure:

```json
{
  "success": true,
  "data": {
    "payer": "Client Name",
    "recipients": [
      {
        "name": "Freelancer Name",
        "wallet": null,
        "share": 100
      }
    ],
    "amounts": [120],
    "currency": "USDC",
    "purpose": "Website development",
    "confidence": 0.92,
    "source": "chat"
  },
  "validation": {
    "isValid": true,
    "isApproved": true,
    "riskScore": 20,
    "issues": [],
    "warnings": []
  }
}
```

## Project Structure

```
ai-modules/
├── invoice-parser/          # Invoice OCR and parsing
│   ├── parseInvoice.js
│   ├── invoiceProcessor.js
│   └── advancedInvoiceParser.js
├── chat-parser/             # Chat message intent detection
│   ├── parseChat.js
│   └── intentDetector.js
├── voice-parser/            # Voice command processing
│   ├── parseVoice.js
│   └── voiceProcessor.js
├── shared/                  # Shared utilities
│   ├── constants.js
│   ├── validators.js
│   ├── validationEngine.js
│   ├── configManager.js
│   └── errorHandler.js
├── index.js                 # Main AI module entry
├── server.js                # Express API server
└── package.json
```

## Configuration

Environment variables:

- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `AI_MIN_CONFIDENCE`: Minimum confidence threshold (0-1)
- `RISK_AUTO_APPROVE_THRESHOLD`: Risk score threshold for auto-approval (0-100)
- `AI_TIMEOUT`: AI processing timeout in milliseconds
- `ELEVENLABS_API_KEY`: ElevenLabs API key (for production voice processing)

## Development

### Run in Development Mode
```bash
npm run dev
```

### Run Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Test Coverage
```bash
npm run test:coverage
```

## Integration with SwiftSplit Backend

The AI modules are designed to be consumed by the SwiftSplit backend:

```javascript
const swiftSplitAI = require('./ai-modules');

// Initialize
await swiftSplitAI.initialize();

// Parse a chat message
const result = await swiftSplitAI.parsePayment(
  { text: "Pay John $120", sender: "Client" },
  'chat'
);

// Use the parsed data
if (result.success && result.validation.isApproved) {
  // Execute payment on Arc blockchain
  await executePayment(result.data);
}
```

## Error Handling

All parsing functions return a standardized error response:

```json
{
  "success": false,
  "error": "Error message",
  "errorCode": "ERROR_CODE",
  "module": "chat-parser"
}
```

## Risk Validation

The validation engine automatically assesses:
- Payment amount thresholds
- AI confidence scores
- Suspicious keywords
- Risk patterns
- Payment frequency

Risk scores:
- **0-49**: Auto-approved
- **50-74**: Requires review
- **75-100**: High risk, manual approval needed

## Voice Processing Note

The current voice parser uses a mock STT implementation for demo purposes. For production:
1. Integrate ElevenLabs Speech-to-Text API
2. Or use Google Cloud Speech-to-Text
3. Or use OpenAI Whisper API

## Tech Stack

- **Node.js** v18+
- **Express.js** - REST API framework
- **Tesseract.js** - OCR engine
- **pdf-parse** - PDF text extraction
- **sharp** - Image preprocessing
- **axios** - HTTP client

## License

MIT

## Support

For issues or questions about the AI modules, contact the SwiftSplit team.
