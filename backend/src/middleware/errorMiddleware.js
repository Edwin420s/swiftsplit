const ResponseHandler = require('../utils/responseHandler');

const errorMiddleware = (error, req, res, next) => {
  console.error('Error:', error);

  // Database errors
  if (error.name === 'SequelizeValidationError') {
    const errors = error.errors.map(err => ({
      field: err.path,
      message: err.message
    }));
    return ResponseHandler.validationError(res, errors);
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    return ResponseHandler.error(res, 'Resource already exists', 409);
  }

  if (error.name === 'SequelizeDatabaseError') {
    return ResponseHandler.error(res, 'Database error occurred', 500);
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return ResponseHandler.unauthorized(res, 'Invalid token');
  }

  if (error.name === 'TokenExpiredError') {
    return ResponseHandler.unauthorized(res, 'Token expired');
  }

  // Blockchain errors
  if (error.message && error.message.includes('insufficient funds')) {
    return ResponseHandler.error(res, 'Insufficient funds for transaction', 400);
  }

  if (error.message && error.message.includes('user rejected')) {
    return ResponseHandler.error(res, 'Transaction rejected by user', 400);
  }

  // Default error
  ResponseHandler.error(res, error.message || 'Internal server error');
};

module.exports = errorMiddleware;