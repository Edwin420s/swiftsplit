const { ethers } = require("ethers");
const { SwiftSplitABI } = require("../artifacts/contracts/SwiftSplit.sol/SwiftSplit.json");
const { TeamSplitterABI } = require("../artifacts/contracts/TeamSplitter.sol/TeamSplitter.json");

class SwiftSplitAPI {
  constructor(rpcUrl, privateKey, contractAddresses) {
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    
    this.swiftSplit = new ethers.Contract(
      contractAddresses.swiftSplit,
      SwiftSplitABI,
      this.wallet
    );
    
    this.teamSplitter = new ethers.Contract(
      contractAddresses.teamSplitter,
      TeamSplitterABI,
      this.wallet
    );
  }

  /**
   * Create a payment via API (after AI verification)
   */
  async createPayment(recipients, amounts, invoiceId, payerAddress) {
    try {
      // Validate inputs
      if (recipients.length !== amounts.length) {
        throw new Error("Recipients and amounts length mismatch");
      }

      // Convert amounts to USDC decimals (6)
      const amountsInWei = amounts.map(amount => 
        ethers.utils.parseUnits(amount.toString(), 6)
      );

      // Estimate gas
      const gasEstimate = await this.swiftSplit.estimateGas.createPayment(
        recipients,
        amountsInWei,
        invoiceId,
        { from: payerAddress }
      );

      // Execute transaction
      const tx = await this.swiftSplit.createPayment(
        recipients,
        amountsInWei,
        invoiceId,
        {
          gasLimit: gasEstimate.mul(120).div(100), // 20% buffer
          gasPrice: await this.provider.getGasPrice()
        }
      );

      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        paymentId: this.getPaymentIdFromReceipt(receipt),
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute a verified payment
   */
  async executePayment(paymentId, payerAddress) {
    try {
      const gasEstimate = await this.swiftSplit.estimateGas.executePayment(
        paymentId,
        { from: payerAddress }
      );

      const tx = await this.swiftSplit.executePayment(paymentId, {
        gasLimit: gasEstimate.mul(120).div(100),
        gasPrice: await this.provider.getGasPrice()
      });

      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a team with predefined splits
   */
  async createTeam(name, members, shares, ownerAddress) {
    try {
      const gasEstimate = await this.teamSplitter.estimateGas.createTeam(
        name,
        members,
        shares,
        { from: ownerAddress }
      );

      const tx = await this.teamSplitter.createTeam(name, members, shares, {
        gasLimit: gasEstimate.mul(120).div(100),
        gasPrice: await this.provider.getGasPrice()
      });

      const receipt = await tx.wait();
      const teamId = this.getTeamIdFromReceipt(receipt);

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        teamId: teamId,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId) {
    try {
      const payment = await this.swiftSplit.getPayment(paymentId);
      
      return {
        payer: payment.payer,
        recipients: payment.recipients,
        amounts: payment.amounts.map(amount => 
          ethers.utils.formatUnits(amount, 6)
        ),
        invoiceId: payment.invoiceId,
        status: this.getStatusText(payment.status),
        createdAt: new Date(payment.createdAt * 1000).toISOString(),
        executedAt: payment.executedAt ? 
          new Date(payment.executedAt * 1000).toISOString() : null
      };
    } catch (error) {
      return {
        error: error.message
      };
    }
  }

  /**
   * Get team details
   */
  async getTeam(teamId) {
    try {
      const team = await this.teamSplitter.getTeam(teamId);
      
      return {
        owner: team.owner,
        name: team.name,
        members: team.members,
        shares: team.shares.map(share => share.toNumber() / 100), // Convert to percentage
        active: team.active,
        createdAt: new Date(team.createdAt * 1000).toISOString()
      };
    } catch (error) {
      return {
        error: error.message
      };
    }
  }

  // Helper methods
  getPaymentIdFromReceipt(receipt) {
    const event = receipt.events.find(e => e.event === 'PaymentCreated');
    return event.args.paymentId;
  }

  getTeamIdFromReceipt(receipt) {
    const event = receipt.events.find(e => e.event === 'TeamCreated');
    return event.args.teamId;
  }

  getStatusText(status) {
    const statusMap = {
      0: 'PENDING',
      1: 'COMPLETED',
      2: 'FAILED',
      3: 'CANCELLED'
    };
    return statusMap[status] || 'UNKNOWN';
  }
}

// Example usage
async function example() {
  const api = new SwiftSplitAPI(
    process.env.ARC_RPC_URL,
    process.env.PRIVATE_KEY,
    {
      swiftSplit: process.env.SWIFTSPLIT_ADDRESS,
      teamSplitter: process.env.TEAMSPLITTER_ADDRESS
    }
  );

  // Example: Create a payment
  const result = await api.createPayment(
    ['0x742E4eB7Db47E34975d68eB128a5D56dC4D2a8f6'],
    [100], // 100 USDC
    'INV-API-001',
    process.env.PAYER_ADDRESS
  );

  console.log('Payment Result:', result);
}

module.exports = SwiftSplitAPI;