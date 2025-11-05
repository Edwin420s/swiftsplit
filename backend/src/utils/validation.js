const { body, param, query } = require('express-validator');

const paymentValidations = {
  createPayment: [
    body('recipients')
      .isArray({ min: 1 })
      .withMessage('At least one recipient is required'),
    body('recipients.*')
      .isEthereumAddress()
      .withMessage('Each recipient must be a valid Ethereum address'),
    body('amounts')
      .isArray({ min: 1 })
      .withMessage('At least one amount is required'),
    body('amounts.*')
      .isFloat({ min: 0.01 })
      .withMessage('Each amount must be a positive number'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters')
  ],

  createTeamPayment: [
    body('teamId')
      .isUUID()
      .withMessage('Valid team ID is required'),
    body('totalAmount')
      .isFloat({ min: 0.01 })
      .withMessage('Total amount must be a positive number'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters')
  ],

  parseChat: [
    body('message')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message must be between 1 and 1000 characters')
  ]
};

const teamValidations = {
  createTeam: [
    body('name')
      .isLength({ min: 1, max: 100 })
      .withMessage('Team name must be between 1 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('defaultSplitType')
      .isIn(['equal', 'percentage', 'fixed'])
      .withMessage('Invalid split type'),
    body('members')
      .optional()
      .isArray()
      .withMessage('Members must be an array')
  ],

  addMember: [
    param('teamId')
      .isUUID()
      .withMessage('Valid team ID is required'),
    body('userId')
      .isUUID()
      .withMessage('Valid user ID is required'),
    body('splitPercentage')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Split percentage must be between 0 and 100'),
    body('fixedAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Fixed amount must be a positive number')
  ]
};

const walletValidations = {
  transfer: [
    body('toAddress')
      .isEthereumAddress()
      .withMessage('Valid recipient address is required'),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be a positive number')
  ]
};

module.exports = {
  paymentValidations,
  teamValidations,
  walletValidations
};