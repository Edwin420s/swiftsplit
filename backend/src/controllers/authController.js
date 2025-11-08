const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { ethers } = require('ethers');
const crypto = require('crypto');
const User = require('../models/User');
const ResponseHandler = require('../utils/responseHandler');
const walletService = require('../services/walletService');

// Store nonces temporarily (in production, use Redis)
const nonces = new Map();

class AuthController {
  async register(req, res) {
    try {
      const { email, password, name, role = 'freelancer' } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return ResponseHandler.error(res, 'User already exists', 409);
      }

      // Create user
      const user = new User({
        email,
        password,
        name,
        role
      });
      await user.save();

      // Create wallet for user
      const walletResult = await walletService.createUserWallet(user.id, {
        name: user.name,
        email: user.email
      });

      if (!walletResult.success) {
        // Delete user if wallet creation fails
        await User.findByIdAndDelete(user._id);
        return ResponseHandler.error(res, 'Failed to create wallet', 500);
      }

      // Update user with wallet address
      user.walletAddress = walletResult.walletAddress;
      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        walletAddress: user.walletAddress,
        kycStatus: user.kycStatus
      };

      ResponseHandler.success(res, {
        user: userResponse,
        token
      }, 'User registered successfully', 201);

    } catch (error) {
      console.error('Registration error:', error);
      ResponseHandler.error(res, 'Registration failed');
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return ResponseHandler.unauthorized(res, 'Invalid credentials');
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return ResponseHandler.unauthorized(res, 'Invalid credentials');
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        walletAddress: user.walletAddress,
        kycStatus: user.kycStatus
      };

      ResponseHandler.success(res, {
        user: userResponse,
        token
      }, 'Login successful');

    } catch (error) {
      console.error('Login error:', error);
      ResponseHandler.error(res, 'Login failed');
    }
  }

  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id).select('-password');

      if (!user) {
        return ResponseHandler.notFound(res, 'User not found');
      }

      // Get wallet balance
      const balanceResult = await walletService.getWalletBalance(user.walletAddress);

      const userProfile = {
        ...user.toJSON(),
        balance: balanceResult.success ? balanceResult.balance : 0
      };

      ResponseHandler.success(res, userProfile, 'Profile retrieved successfully');

    } catch (error) {
      console.error('Profile fetch error:', error);
      ResponseHandler.error(res, 'Failed to fetch profile');
    }
  }

  async updateProfile(req, res) {
    try {
      const { name } = req.body;
      const userId = req.user.id;

      const user = await User.findById(userId);
      if (!user) {
        return ResponseHandler.notFound(res, 'User not found');
      }

      user.name = name;
      await user.save();

      const updatedUser = await User.findById(userId).select('-password');

      ResponseHandler.success(res, updatedUser, 'Profile updated successfully');

    } catch (error) {
      console.error('Profile update error:', error);
      ResponseHandler.error(res, 'Failed to update profile');
    }
  }

  // Generate nonce for wallet signature verification
  async getNonce(req, res) {
    try {
      const { address } = req.query;

      if (!address || !ethers.utils.isAddress(address)) {
        return ResponseHandler.error(res, 'Invalid wallet address', 400);
      }

      // Generate random nonce
      const nonce = crypto.randomBytes(32).toString('hex');
      
      // Store nonce with 5 minute expiration
      nonces.set(address.toLowerCase(), {
        nonce,
        expiresAt: Date.now() + 5 * 60 * 1000
      });

      // Clean up expired nonces
      for (const [addr, data] of nonces.entries()) {
        if (data.expiresAt < Date.now()) {
          nonces.delete(addr);
        }
      }

      ResponseHandler.success(res, { nonce }, 'Nonce generated');

    } catch (error) {
      console.error('Nonce generation error:', error);
      ResponseHandler.error(res, 'Failed to generate nonce');
    }
  }

  // Wallet-based login with signature verification
  async walletLogin(req, res) {
    try {
      const { address, signature, nonce: providedNonce } = req.body;

      if (!address || !signature || !providedNonce) {
        return ResponseHandler.error(res, 'Missing required fields', 400);
      }

      if (!ethers.utils.isAddress(address)) {
        return ResponseHandler.error(res, 'Invalid wallet address', 400);
      }

      const normalizedAddress = address.toLowerCase();

      // Verify nonce exists and is not expired
      const storedNonceData = nonces.get(normalizedAddress);
      if (!storedNonceData) {
        return ResponseHandler.error(res, 'No nonce found. Please request a new one.', 400);
      }

      if (storedNonceData.expiresAt < Date.now()) {
        nonces.delete(normalizedAddress);
        return ResponseHandler.error(res, 'Nonce expired. Please request a new one.', 400);
      }

      if (storedNonceData.nonce !== providedNonce) {
        return ResponseHandler.error(res, 'Invalid nonce', 400);
      }

      // Verify signature
      const message = `SwiftSplit Login\n\nSign this message to authenticate your wallet.\n\nNonce: ${providedNonce}`;
      
      let recoveredAddress;
      try {
        recoveredAddress = ethers.utils.verifyMessage(message, signature);
      } catch (err) {
        return ResponseHandler.error(res, 'Invalid signature', 400);
      }

      if (recoveredAddress.toLowerCase() !== normalizedAddress) {
        return ResponseHandler.error(res, 'Signature verification failed', 401);
      }

      // Remove used nonce
      nonces.delete(normalizedAddress);

      // Find or create user
      let user = await User.findOne({ walletAddress: normalizedAddress });

      if (!user) {
        // Create new user with wallet address
        user = new User({
          walletAddress: normalizedAddress,
          name: `User ${address.substring(0, 6)}`,
          role: 'freelancer',
          authMethod: 'wallet'
        });
        await user.save();
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, walletAddress: user.walletAddress },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const userResponse = {
        id: user.id,
        walletAddress: user.walletAddress,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt
      };

      ResponseHandler.success(res, {
        user: userResponse,
        token
      }, user.isNew ? 'Account created and logged in' : 'Login successful');

    } catch (error) {
      console.error('Wallet login error:', error);
      ResponseHandler.error(res, 'Wallet authentication failed');
    }
  }
}

module.exports = new AuthController();