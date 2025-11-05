const express = require('express');
const multer = require('multer');
const aiService = require('../services/aiService');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.use(authMiddleware);

router.post('/parse-invoice', upload.single('invoice'), async (req, res) => {
  try {
    const result = await aiService.parseInvoice(req.file);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/parse-chat', async (req, res) => {
  try {
    const { message } = req.body;
    const result = await aiService.parseChatMessage(message);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;