const axios = require('axios');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const blockchainService = require('./blockchainService');

class CircleWalletService {
  constructor() {
    this.apiKey = process.env.CIRCLE_API_KEY;
    this.baseURL = 'https://api.circle.com/v1/w3s';
    
    this.httpClient = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async createUserWallet(userId, userData) {
    try {
      console.log(`Creating Circle Wallet for user ${userId}...`);

      // Check if user already has a wallet
      const user = await User.findByPk(userId);
      if (user && user.walletAddress) {
        console.log(`User ${userId} already has a wallet: ${user.walletAddress}`);
        return {
          success: true,
          walletAddress: user.walletAddress,
          walletId: user.walletId,
          existing: true
        };
      }

      // Create user in Circle
      const userResponse = await this.httpClient.post('/users', {
        userId: userId.toString(),
        ...userData
      });

      // Create wallet for user on Arc-compatible network
      const walletResponse = await this.httpClient.post('/user/wallets', {
        userId: userId.toString(),
        blockchains: ['ETH-SEPOLIA'], // Arc testnet compatible (EVM)
        accountType: 'SCA' // Smart Contract Account
      });

      const wallet = walletResponse.data.data;

      // Store wallet info in database
      await User.update({
        circleUserId: userResponse.data.data.userId,
        walletAddress: wallet.address,
        walletId: wallet.id,
        kycStatus: true
      }, { where: { id: userId } });

      // Log wallet creation
      await AuditLog.logAction({
        action: 'wallet_created',
        entityType: 'wallet',
        entityId: wallet.id,
        userId,
        walletAddress: wallet.address,
        description: `Circle Wallet created for user`,
        metadata: {
          circleUserId: userResponse.data.data.userId,
          blockchain: 'ETH-SEPOLIA',
          accountType: 'SCA'
        }
      });

      console.log(`Wallet created successfully: ${wallet.address}`);

      return {
        success: true,
        walletAddress: wallet.address,
        walletId: wallet.id,
        circleUserId: userResponse.data.data.userId
      };
    } catch (error) {
      console.error('Circle wallet creation error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async getWalletBalance(walletAddress, userId = null) {
    try {
      // Use blockchain service to get USDC balance on Arc
      const balance = await blockchainService.getUSDCBalance(walletAddress);
      
      return {
        success: true,
        balance: parseFloat(balance),
        currency: 'USDC',
        walletAddress
      };
    } catch (error) {
      console.error('Balance fetch error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getWalletInfo(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user || !user.walletAddress) {
        return {
          success: false,
          error: 'User wallet not found'
        };
      }

      const balanceResult = await this.getWalletBalance(user.walletAddress, userId);

      return {
        success: true,
        wallet: {
          address: user.walletAddress,
          walletId: user.walletId,
          circleUserId: user.circleUserId,
          balance: balanceResult.balance || 0,
          currency: 'USDC',
          kycStatus: user.kycStatus
        }
      };
    } catch (error) {
      console.error('Wallet info fetch error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async transferUSDC(fromUserId, toWalletAddress, amount, description = '') {
    try {
      const user = await User.findByPk(fromUserId);
      if (!user || !user.walletId) {
        throw new Error('User wallet not found');
      }

      console.log(`Transferring ${amount} USDC from ${user.walletAddress} to ${toWalletAddress}`);

      // Create transfer via Circle API
      const transferResponse = await this.httpClient.post('/user/transfers', {
        userId: user.circleUserId,
        destinationAddress: toWalletAddress,
        amount: {
          amount: amount.toString(),
          currency: 'USD'
        },
        fee: {
          amount: '0',
          currency: 'USD'
        },
        tokenId: process.env.USDC_TOKEN_ID
      });

      const transferData = transferResponse.data.data;

      // Log transfer
      await AuditLog.logAction({
        action: 'payment_created',
        entityType: 'payment',
        entityId: transferData.id,
        userId: fromUserId,
        walletAddress: user.walletAddress,
        description: description || `USDC transfer to ${toWalletAddress}`,
        metadata: {
          amount,
          recipient: toWalletAddress,
          transferId: transferData.id,
          status: transferData.status
        }
      });

      return {
        success: true,
        transferId: transferData.id,
        status: transferData.status,
        amount
      };
    } catch (error) {
      console.error('Transfer error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async verifyWalletAddress(address) {
    // Validate Ethereum address format
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
  }

  isServiceAvailable() {
    return !!this.apiKey && this.apiKey !== 'your_circle_api_key_from_developer_portal';
  }
}

module.exports = new CircleWalletService();