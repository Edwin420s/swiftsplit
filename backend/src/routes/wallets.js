const express = require('express');
const walletService = require('../services/walletService');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/create', async (req, res) => {
  try {
    const result = await walletService.createUserWallet(req.user.id, {
      name: req.user.name,
      email: req.user.email
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/balance', async (req, res) => {
  try {
    const result = await walletService.getWalletBalance(req.user.walletAddress);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Alias: GET /wallets/:address/balance
router.get('/:address/balance', async (req, res) => {
  try {
    const { address } = req.params;
    const result = await walletService.getWalletBalance(address);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/transfer', async (req, res) => {
  try {
    const { toAddress, amount } = req.body;
    const result = await walletService.transferUSDC(req.user.id, toAddress, amount);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;