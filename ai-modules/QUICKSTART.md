# SwiftSplit AI Modules - Quick Start Guide

## 🚀 Get Started in 3 Minutes

### Step 1: Install Dependencies
```bash
cd ai-modules
npm install
```

### Step 2: Start the Server
```bash
npm start
```

Server will run on `http://localhost:3001`

### Step 3: Test It!

#### Test Chat Parser
```bash
curl -X POST http://localhost:3001/api/parse/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Pay John $120 for website", "sender": "Client"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "payer": "Client",
    "recipients": [{"name": "John", "wallet": null}],
    "amounts": [120],
    "currency": "USDC",
    "purpose": "website",
    "confidence": 0.9
  }
}
```

#### Test Health Check
```bash
curl http://localhost:3001/health
```

## 📝 Common Use Cases

### Parse a Simple Payment
```javascript
const result = await fetch('http://localhost:3001/api/parse/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Send Sarah $500 for logo design",
    sender: "Manager"
  })
});
```

### Parse Split Payment
```javascript
const result = await fetch('http://localhost:3001/api/parse/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Split $1000 between Jane, Alex, and Maria",
    sender: "ProjectLead"
  })
});
```

### Parse Invoice (Multipart Form)
```javascript
const formData = new FormData();
formData.append('invoice', invoiceFile);

const result = await fetch('http://localhost:3001/api/parse/invoice', {
  method: 'POST',
  body: formData
});
```

## 🔧 Development Mode

Run with auto-reload:
```bash
npm run dev
```

## 📦 Using as a Module

```javascript
const swiftSplitAI = require('./ai-modules');

// Initialize
await swiftSplitAI.initialize();

// Parse payment
const result = await swiftSplitAI.parsePayment(
  { text: "Pay John $120", sender: "Client" },
  'chat'
);

// Check result
if (result.success && result.validation.isApproved) {
  // Execute payment
  console.log('Payment approved:', result.data);
}
```

## 🎯 Test Examples

Run the example file:
```bash
node example-usage.js
```

This will demonstrate:
- Chat message parsing
- Invoice parsing
- Voice command parsing
- Batch processing
- Error handling
- Integration patterns

## 🔑 Environment Variables

Create `.env` file:
```bash
cp .env.example .env
```

Edit if needed:
```env
PORT=3001
AI_MIN_CONFIDENCE=0.85
RISK_AUTO_APPROVE_THRESHOLD=50
```

## 🛠️ Troubleshooting

### Port Already in Use
```bash
# Change port in .env
PORT=3002
```

### Dependencies Not Installing
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### OCR Not Working
- Sharp and Tesseract.js require build tools on Windows
- Install Windows Build Tools: `npm install --global windows-build-tools`

## 📚 Next Steps

1. ✅ Start the server
2. ✅ Test the API endpoints
3. ✅ Integrate with your backend
4. ✅ Connect to Arc blockchain for actual payments
5. ✅ Add Circle Wallet authentication

## 💡 Pro Tips

- Use batch processing for multiple payments
- Check validation.isApproved before executing payments
- Monitor validation.riskScore for suspicious activity
- Implement webhook notifications for high-risk payments

## 🎉 You're Ready!

The AI modules are now parsing payment intents. Next step: integrate with your SwiftSplit backend to execute payments on Arc with USDC.

---

**Need Help?** Check README.md for detailed documentation.
