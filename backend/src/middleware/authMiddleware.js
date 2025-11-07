const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ResponseHandler = require('../utils/responseHandler');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return ResponseHandler.unauthorized(res, 'No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return ResponseHandler.unauthorized(res, 'Invalid token');
    }

    req.user = user;
    next();
  } catch (error) {
    return ResponseHandler.unauthorized(res, 'Token verification failed');
  }
};

module.exports = authMiddleware;