const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimit');
const { body } = require('express-validator');
const handleValidationErrors = require('../middleware/validationMiddleware');

const router = express.Router();

router.post('/register', 
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').isLength({ min: 1, max: 100 }),
    body('role').optional().isIn(['client', 'freelancer', 'team_manager'])
  ],
  handleValidationErrors,
  authController.register
);

router.post('/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 1 })
  ],
  handleValidationErrors,
  authController.login
);

router.get('/profile',
  authMiddleware,
  authController.getProfile
);

router.put('/profile',
  authMiddleware,
  [
    body('name').isLength({ min: 1, max: 100 })
  ],
  handleValidationErrors,
  authController.updateProfile
);

// Wallet authentication routes
router.get('/nonce',
  authController.getNonce
);

router.post('/wallet-login',
  authLimiter,
  [
    body('address').isString().notEmpty(),
    body('signature').isString().notEmpty(),
    body('nonce').isString().notEmpty()
  ],
  handleValidationErrors,
  authController.walletLogin
);

module.exports = router;