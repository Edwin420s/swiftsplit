const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ResponseHandler = require('../utils/responseHandler');
const walletService = require('../services/walletService');

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
}

module.exports = new AuthController();