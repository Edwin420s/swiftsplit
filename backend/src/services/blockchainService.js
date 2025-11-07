const { ethers } = require('ethers');
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
      // view helpers (not strictly required but useful)
      'event PaymentCreated(bytes32 indexed paymentId, address indexed payer, address[] recipients, uint256[] amounts, string invoiceId)',
      'event PaymentExecuted(bytes32 indexed paymentId, address indexed payer, uint256 totalAmount)'
    ];
  }

  // Backward compatibility: accepts recipients/amounts and internally creates & executes a payment
  async executePayment(recipients, amounts, invoiceId = 'auto') {
    return this.createAndExecutePayment(recipients, amounts, invoiceId);
  }

  // New flow aligned with SwiftSplit contract
  async createAndExecutePayment(recipients, amounts, invoiceId = 'INV-AUTO') {
    if (!this.swiftSplit) {
      return {
        success: false,
        error: 'Blockchain service not initialized. Ensure PRIVATE_KEY, ARC_RPC_URL, and SWIFTSPLIT_CONTRACT_ADDRESS are set.'
      };
    }

    try {
      // Convert amounts to USDC 6 decimals
      const amountsInUnits = amounts.map((a) => ethers.parseUnits(a.toString(), 6));

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
              break;
            }
          } catch (_) { /* ignore parse errors for unrelated logs */ }
        }
      }

      if (!paymentId) {
        // Fallback: read the first topic if it matches event signature (not guaranteed)
        // but better to error out with a clear message
        return { success: false, error: 'Failed to retrieve paymentId from PaymentCreated event' };
      }

      // 2) Execute payment
      const execTx = await this.swiftSplit.executePayment(paymentId);
      const execRcpt = await execTx.wait();

      return {
        success: true,
        paymentId: paymentId,
        transactionHash: execRcpt.hash,
        blockNumber: execRcpt.blockNumber
      };
    } catch (error) {
      console.error('Blockchain transaction failed:', error);
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
}

module.exports = new BlockchainService();