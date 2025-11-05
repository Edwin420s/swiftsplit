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
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return ResponseHandler.error(res, 'User already exists', 409);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await User.create({
        email,
        password: hashedPassword,
        name,
        role
      });

      // Create wallet for user
      const walletResult = await walletService.createUserWallet(user.id, {
        name: user.name,
        email: user.email
      });

      if (!walletResult.success) {
        // Delete user if wallet creation fails
        await User.destroy({ where: { id: user.id } });
        return ResponseHandler.error(res, 'Failed to create wallet', 500);
      }

      // Update user with wallet address
      await user.update({
        walletAddress: walletResult.walletAddress
      });

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
      const user = await User.findOne({ where: { email } });
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
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
      });

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

      const user = await User.findByPk(userId);
      if (!user) {
        return ResponseHandler.notFound(res, 'User not found');
      }

      await user.update({ name });

      const updatedUser = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      ResponseHandler.success(res, updatedUser, 'Profile updated successfully');

    } catch (error) {
      console.error('Profile update error:', error);
      ResponseHandler.error(res, 'Failed to update profile');
    }
  }
}

module.exports = new AuthController();