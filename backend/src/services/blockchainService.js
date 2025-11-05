const { ethers } = require('ethers');
require('dotenv').config();

class BlockchainService {
  constructor() {
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