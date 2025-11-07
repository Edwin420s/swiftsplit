const axios = require('axios');
const User = require('../models/User');
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
      // Create user in Circle
      const userResponse = await this.httpClient.post('/users', {
        userId: userId.toString(),
        ...userData
      });

      // Create wallet for user
      const walletResponse = await this.httpClient.post('/user/wallets', {
        userId: userId.toString(),
        blockchains: ['ETH-SEPOLIA'], // Arc testnet compatible
        accountType: 'SCA'
      });

      const wallet = walletResponse.data.data;

      // Store wallet info in database
      await User.update({
        circleUserId: userResponse.data.data.userId,
        walletAddress: wallet.address,
        walletId: wallet.id
      }, { where: { id: userId } });

      return {
        success: true,
        walletAddress: wallet.address,
        walletId: wallet.id
      };
    } catch (error) {
      console.error('Circle wallet creation error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async getWalletBalance(walletAddress) {
    try {
      // For demo, we'll use the blockchain service
      // In production, use Circle's balance endpoint
      const balance = await blockchainService.getUSDCBalance(walletAddress);
      
      return {
        success: true,
        balance: parseFloat(balance),
        currency: 'USDC'
      };
    } catch (error) {
      console.error('Balance fetch error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async transferUSDC(fromUserId, toWalletAddress, amount) {
    try {
      const user = await User.findByPk(fromUserId);
      if (!user || !user.walletId) {
        throw new Error('User wallet not found');
      }

      // Create transfer
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

      return {
        success: true,
        transferId: transferResponse.data.data.id,
        status: transferResponse.data.data.status
      };
    } catch (error) {
      console.error('Transfer error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}

module.exports = new CircleWalletService();