const { validationResult } = require('express-validator');
const ResponseHandler = require('../utils/responseHandler');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    return ResponseHandler.validationError(res, formattedErrors);
  }
  
  next();
};

module.exports = handleValidationErrors;