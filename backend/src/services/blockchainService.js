const { ethers } = require('ethers');
require('dotenv').config();

class BlockchainService {
  constructor() {
    if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY === '0xyour_arc_wallet_private_key') {
      console.warn('PRIVATE_KEY not set or using placeholder. Blockchain operations will be disabled.');
      this.provider = null;
      this.wallet = null;
      this.contract = null;
      return;
    }

    this.provider = new ethers.JsonRpcProvider(process.env.ARC_RPC_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(
      process.env.PAYMENT_CONTRACT_ADDRESS,
      this.getContractABI(),
      this.wallet
    );
  }

  getContractABI() {
    return [
      "function executePayment(address[] recipients, uint256[] amounts) external returns (bool)",
      "event PaymentExecuted(address indexed payer, address[] recipients, uint256[] amounts, uint256 total)"
    ];
  }

  async executePayment(recipients, amounts) {
    if (!this.contract) {
      return {
        success: false,
        error: 'Blockchain service not initialized. Please set PRIVATE_KEY in environment variables.'
      };
    }

    try {
      // Convert amounts to wei (USDC uses 6 decimals)
      const amountsInWei = amounts.map(amount =>
        ethers.parseUnits(amount.toString(), 6)
      );

      const transaction = await this.contract.executePayment(recipients, amountsInWei);
      const receipt = await transaction.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
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
      // USDC contract on Arc
      const usdcContract = new ethers.Contract(
        process.env.USDC_CONTRACT_ADDRESS,
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