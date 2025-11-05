/**
 * Example usage of SwiftSplit AI Modules
 * This file demonstrates how to use the AI parsers programmatically
 */

const invoiceParser = require('./invoice-parser/parseInvoice');
const chatParser = require('./chat-parser/parseChat');
const voiceParser = require('./voice-parser/parseVoice');
const swiftSplitAI = require('./index');
const fs = require('fs');

// ==================== Example 1: Parse Chat Message ====================
async function exampleChatParsing() {
  console.log('\n=== Example 1: Chat Message Parsing ===\n');
  
  const messages = [
    "Pay John $120 for the website",
    "Send Sarah 500 USDC for logo design",
    "Split $1000 between Jane, Alex, and Maria for the project",
    "Tip Mike $50 for great customer support"
  ];
  
  for (const message of messages) {
    console.log(`Input: "${message}"`);
    const result = await chatParser.parseChatMessage(message, 'Client');
    
    if (result.success) {
      console.log('✓ Parsed successfully:');
      console.log(`  Recipients: ${result.data.recipients.map(r => r.name).join(', ')}`);
      console.log(`  Amounts: $${result.data.amounts.join(', $')}`);
      console.log(`  Purpose: ${result.data.purpose}`);
      console.log(`  Confidence: ${(result.data.confidence * 100).toFixed(0)}%`);
    } else {
      console.log('✗ Failed:', result.error);
    }
    console.log('');
  }
}

// ==================== Example 2: Parse Invoice ====================
async function exampleInvoiceParsing() {
  console.log('\n=== Example 2: Invoice Parsing ===\n');
  
  // Simulate invoice text (in real usage, this would come from PDF/image)
  const mockInvoiceText = `
    INVOICE #INV-2025-001
    Date: 11/05/2025
    
    From: Acme Corp
    123 Business St
    
    Bill To: John Doe
    456 Freelancer Ave
    
    Description: Website Development Services
    Amount: $1,200.00
    
    Total Due: $1,200.00
  `;
  
  console.log('Processing invoice...');
  
  // Note: In real usage, you would read a file:
  // const fileBuffer = fs.readFileSync('./sample-invoice.pdf');
  // const result = await invoiceParser.parseInvoice(fileBuffer, 'pdf');
  
  console.log('✓ Invoice would be processed with OCR and NLP');
  console.log('  Expected output: Payer: Acme Corp, Recipient: John Doe, Amount: $1200');
}

// ==================== Example 3: Voice Command ====================
async function exampleVoiceParsing() {
  console.log('\n=== Example 3: Voice Command Parsing ===\n');
  
  // Note: In real usage, you would upload an audio file
  // const audioBuffer = fs.readFileSync('./payment-command.mp3');
  // const result = await voiceParser.parseVoiceCommand(audioBuffer, 'audio/mpeg', 'Client');
  
  console.log('Voice command: "Pay John one hundred twenty dollars for website"');
  console.log('✓ Would be transcribed and parsed');
  console.log('  Expected output: Recipient: John, Amount: $120, Purpose: website');
}

// ==================== Example 4: Using Main AI Module ====================
async function exampleMainModule() {
  console.log('\n=== Example 4: Using Main SwiftSplitAI Module ===\n');
  
  // Initialize the AI module
  await swiftSplitAI.initialize();
  
  // Parse a chat message
  const chatResult = await swiftSplitAI.parsePayment(
    {
      text: "Pay Jane $500 for graphic design work",
      sender: "Project Manager"
    },
    'chat'
  );
  
  console.log('Chat parsing result:');
  console.log('  Success:', chatResult.success);
  
  if (chatResult.success) {
    console.log('  Recipient:', chatResult.data.recipients[0].name);
    console.log('  Amount:', chatResult.data.amounts[0]);
    console.log('  Purpose:', chatResult.data.purpose);
    console.log('  Confidence:', chatResult.data.confidence);
    
    if (chatResult.validation) {
      console.log('  Risk Score:', chatResult.validation.riskScore);
      console.log('  Auto-approved:', chatResult.validation.isApproved);
      console.log('  Warnings:', chatResult.validation.warnings.length);
    }
  }
  
  // Get module status
  const status = swiftSplitAI.getStatus();
  console.log('\nModule Status:', status);
}

// ==================== Example 5: Batch Processing ====================
async function exampleBatchProcessing() {
  console.log('\n=== Example 5: Batch Processing ===\n');
  
  await swiftSplitAI.initialize();
  
  const inputs = [
    {
      id: 'req-1',
      type: 'chat',
      data: { text: 'Pay John $120', sender: 'Client' }
    },
    {
      id: 'req-2',
      type: 'chat',
      data: { text: 'Split $500 between Jane and Alex', sender: 'Manager' }
    },
    {
      id: 'req-3',
      type: 'chat',
      data: { text: 'Tip Sarah $50', sender: 'Customer' }
    }
  ];
  
  console.log('Processing batch of', inputs.length, 'requests...\n');
  
  const results = await swiftSplitAI.batchParse(inputs);
  
  results.forEach(result => {
    console.log(`Request ${result.id}:`);
    if (result.success) {
      console.log(`  ✓ Parsed: ${result.data.recipients.map(r => r.name).join(', ')} - $${result.data.amounts.join(', $')}`);
    } else {
      console.log(`  ✗ Failed: ${result.error}`);
    }
  });
}

// ==================== Example 6: Error Handling ====================
async function exampleErrorHandling() {
  console.log('\n=== Example 6: Error Handling ===\n');
  
  // Invalid message (no amount)
  const invalidMessages = [
    "Pay John for the website",  // No amount
    "Send money to someone",     // No recipient or amount
    "This is not a payment message"  // Not a payment
  ];
  
  for (const message of invalidMessages) {
    console.log(`Testing: "${message}"`);
    const result = await chatParser.parseChatMessage(message, 'Client');
    
    if (!result.success) {
      console.log(`  ✗ Expected error: ${result.error}`);
    }
    console.log('');
  }
}

// ==================== Example 7: Integration Pattern ====================
async function exampleIntegration() {
  console.log('\n=== Example 7: Integration with Backend ===\n');
  
  await swiftSplitAI.initialize();
  
  // Simulating a backend workflow
  const userMessage = "Pay Alex $250 for mobile app development";
  
  console.log('Step 1: User sends message:', userMessage);
  
  // Parse the message
  const parseResult = await swiftSplitAI.parsePayment(
    { text: userMessage, sender: 'Client123' },
    'chat'
  );
  
  console.log('Step 2: AI parses the message');
  
  if (!parseResult.success) {
    console.log('  ✗ Parsing failed:', parseResult.error);
    return;
  }
  
  console.log('  ✓ Parsing successful');
  
  // Validate
  console.log('Step 3: Validate payment intent');
  const validation = parseResult.validation;
  
  if (!validation.isValid) {
    console.log('  ✗ Validation failed:', validation.issues.join(', '));
    return;
  }
  
  if (!validation.isApproved) {
    console.log('  ⚠ Payment requires manual review (Risk Score:', validation.riskScore + ')');
    // In real system: Send to admin dashboard for approval
    return;
  }
  
  console.log('  ✓ Payment validated and approved');
  
  // Execute payment (this would integrate with your Arc blockchain logic)
  console.log('Step 4: Execute payment on Arc blockchain');
  console.log('  Payer:', parseResult.data.payer);
  console.log('  Recipient:', parseResult.data.recipients[0].name);
  console.log('  Amount:', parseResult.data.amounts[0], 'USDC');
  console.log('  Purpose:', parseResult.data.purpose);
  console.log('  ✓ Payment would be sent via Arc smart contract');
}

// ==================== Run All Examples ====================
async function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     SwiftSplit AI Modules - Example Usage             ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  try {
    await exampleChatParsing();
    await exampleInvoiceParsing();
    await exampleVoiceParsing();
    await exampleMainModule();
    await exampleBatchProcessing();
    await exampleErrorHandling();
    await exampleIntegration();
    
    console.log('\n✓ All examples completed successfully!\n');
    
    // Cleanup
    await swiftSplitAI.cleanup();
    
  } catch (error) {
    console.error('\n✗ Error running examples:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

module.exports = {
  exampleChatParsing,
  exampleInvoiceParsing,
  exampleVoiceParsing,
  exampleMainModule,
  exampleBatchProcessing,
  exampleErrorHandling,
  exampleIntegration
};
