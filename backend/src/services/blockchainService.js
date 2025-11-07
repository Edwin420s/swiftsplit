const { ethers } = require('ethers');
const AuditLog = require('../models/AuditLog');
require('dotenv').config();

class BlockchainService {
  constructor() {
    const pk = process.env.PRIVATE_KEY;
    const rpc = process.env.ARC_RPC_URL;
    const swiftSplitAddress = process.env.SWIFTSPLIT_CONTRACT_ADDRESS;

    if (!pk || pk === '0xyour_arc_wallet_private_key') {
      console.warn('PRIVATE_KEY not set or using placeholder. Blockchain operations will be disabled.');
      this.provider = null;
      this.wallet = null;
      this.swiftSplit = null;
      return;
    }

    if (!rpc) {
      console.warn('ARC_RPC_URL not set. Blockchain operations will be disabled.');
      this.provider = null;
      this.wallet = null;
      this.swiftSplit = null;
      return;
    }

    if (!swiftSplitAddress) {
      console.warn('SWIFTSPLIT_CONTRACT_ADDRESS not set. Payment execution will be disabled.');
    }

    this.provider = new ethers.JsonRpcProvider(rpc);
    this.wallet = new ethers.Wallet(pk, this.provider);

    this.swiftSplit = swiftSplitAddress
      ? new ethers.Contract(swiftSplitAddress, this.getSwiftSplitABI(), this.wallet)
      : null;
  }

  getSwiftSplitABI() {
    return [
      // create -> returns bytes32 paymentId
      'function createPayment(address[] _recipients, uint256[] _amounts, string _invoiceId) external returns (bytes32)',
      // execute by paymentId
      'function executePayment(bytes32 _paymentId) external',
      // view payment details
      'function getPayment(bytes32 _paymentId) external view returns (address payer, address[] recipients, uint256[] amounts, bool executed, string invoiceId)',
      // events
      'event PaymentCreated(bytes32 indexed paymentId, address indexed payer, address[] recipients, uint256[] amounts, string invoiceId)',
      'event PaymentExecuted(bytes32 indexed paymentId, address indexed payer, uint256 totalAmount)'
    ];
  }

  // Backward compatibility: accepts recipients/amounts and internally creates & executes a payment
  async executePayment(recipients, amounts, invoiceId = 'auto', userId = null) {
    return this.createAndExecutePayment(recipients, amounts, invoiceId, userId);
  }

  // New flow aligned with SwiftSplit contract
  async createAndExecutePayment(recipients, amounts, invoiceId = 'INV-AUTO', userId = null) {
    if (!this.swiftSplit) {
      return {
        success: false,
        error: 'Blockchain service not initialized. Ensure PRIVATE_KEY, ARC_RPC_URL, and SWIFTSPLIT_CONTRACT_ADDRESS are set.'
      };
    }

    try {
      // Validate inputs
      if (!recipients || recipients.length === 0) {
        throw new Error('Recipients array is empty');
      }
      if (!amounts || amounts.length === 0) {
        throw new Error('Amounts array is empty');
      }
      if (recipients.length !== amounts.length) {
        throw new Error('Recipients and amounts arrays must have the same length');
      }

      // Convert amounts to USDC 6 decimals
      const amountsInUnits = amounts.map((a) => ethers.parseUnits(a.toString(), 6));

      // Calculate total amount
      const totalAmount = amounts.reduce((sum, amt) => sum + parseFloat(amt), 0);

      console.log(`Creating payment on Arc: ${recipients.length} recipients, total: ${totalAmount} USDC`);

      // 1) Create payment
      const createTx = await this.swiftSplit.createPayment(recipients, amountsInUnits, invoiceId || '');
      const createRcpt = await createTx.wait();

      // Extract paymentId from event
      let paymentId = null;
      if (createRcpt.logs && createRcpt.logs.length) {
        // Try to find PaymentCreated event
        for (const log of createRcpt.logs) {
          try {
            const parsed = this.swiftSplit.interface.parseLog(log);
            if (parsed && parsed.name === 'PaymentCreated') {
              paymentId = parsed.args.paymentId;
              console.log(`Payment created on Arc with ID: ${paymentId}`);
              break;
            }
          } catch (_) { /* ignore parse errors for unrelated logs */ }
        }
      }

      if (!paymentId) {
        return { success: false, error: 'Failed to retrieve paymentId from PaymentCreated event' };
      }

      // Log payment creation
      if (userId) {
        await AuditLog.logAction({
          action: 'payment_created',
          entityType: 'payment',
          entityId: paymentId,
          userId,
          walletAddress: this.wallet.address,
          description: `Payment created on Arc blockchain with ${recipients.length} recipients`,
          metadata: {
            invoiceId,
            totalAmount,
            recipients,
            transactionHash: createRcpt.hash
          }
        });
      }

      // 2) Execute payment
      console.log(`Executing payment ${paymentId} on Arc...`);
      const execTx = await this.swiftSplit.executePayment(paymentId);
      const execRcpt = await execTx.wait();

      console.log(`Payment executed successfully: ${execRcpt.hash}`);

      // Log payment execution
      if (userId) {
        await AuditLog.logAction({
          action: 'payment_executed',
          entityType: 'payment',
          entityId: paymentId,
          userId,
          walletAddress: this.wallet.address,
          description: `Payment executed on Arc blockchain`,
          metadata: {
            transactionHash: execRcpt.hash,
            blockNumber: execRcpt.blockNumber,
            gasUsed: execRcpt.gasUsed.toString()
          }
        });
      }

      return {
        success: true,
        paymentId: paymentId,
        transactionHash: execRcpt.hash,
        blockNumber: execRcpt.blockNumber,
        gasUsed: execRcpt.gasUsed.toString(),
        totalAmount
      };
    } catch (error) {
      console.error('Blockchain transaction failed:', error);
      
      // Log failure
      if (userId) {
        await AuditLog.logAction({
          action: 'payment_failed',
          entityType: 'payment',
          entityId: invoiceId || 'unknown',
          userId,
          description: `Payment execution failed on Arc blockchain`,
          metadata: {
            error: error.message,
            recipients,
            amounts
          },
          status: 'failure'
        });
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  async getUSDCBalance(walletAddress) {
    if (!this.provider) {
      return '0';
    }

    try {
      const usdcAddress = process.env.USDC_CONTRACT_ADDRESS;
      if (!usdcAddress) return '0';

      const usdcContract = new ethers.Contract(
        usdcAddress,
        ['function balanceOf(address) view returns (uint256)'],
        this.provider
      );

      const balance = await usdcContract.balanceOf(walletAddress);
      return ethers.formatUnits(balance, 6);
    } catch (error) {
      console.error('Error fetching balance:', error);
      return '0';
    }
  }

  async getPaymentDetails(paymentId) {
    if (!this.swiftSplit) {
      return { success: false, error: 'Blockchain service not initialized' };
    }

    try {
      const payment = await this.swiftSplit.getPayment(paymentId);
      return {
        success: true,
        payment: {
          payer: payment.payer,
          recipients: payment.recipients,
          amounts: payment.amounts.map(a => ethers.formatUnits(a, 6)),
          executed: payment.executed,
          invoiceId: payment.invoiceId
        }
      };
    } catch (error) {
      console.error('Error fetching payment details:', error);
      return { success: false, error: error.message };
    }
  }

  async estimateGas(recipients, amounts) {
    if (!this.swiftSplit) {
      return { success: false, error: 'Blockchain service not initialized' };
    }

    try {
      const amountsInUnits = amounts.map((a) => ethers.parseUnits(a.toString(), 6));
      const gasEstimate = await this.swiftSplit.createPayment.estimateGas(recipients, amountsInUnits, 'estimate');
      
      return {
        success: true,
        gasEstimate: gasEstimate.toString(),
        gasCostUSDC: ethers.formatUnits(gasEstimate, 6)
      };
    } catch (error) {
      console.error('Error estimating gas:', error);
      return { success: false, error: error.message };
    }
  }

  getNetworkInfo() {
    return {
      network: 'Arc Testnet',
      rpcUrl: process.env.ARC_RPC_URL,
      contractAddress: process.env.SWIFTSPLIT_CONTRACT_ADDRESS,
      usdcAddress: process.env.USDC_CONTRACT_ADDRESS,
      walletAddress: this.wallet ? this.wallet.address : null,
      initialized: !!this.swiftSplit
    };
  }
}

module.exports = new BlockchainService();