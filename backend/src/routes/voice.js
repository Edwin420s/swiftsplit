const express = require('express');
const multer = require('multer');
const voiceService = require('../services/voiceService');
const aiService = require('../services/aiService');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ dest: 'uploads/voice/' });

router.use(authMiddleware);

router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const transcription = await voiceService.transcribeVoice(req.file.buffer);
    
    if (transcription.success) {
      // Parse the transcribed text
      const parsed = await aiService.parseChatMessage(transcription.transcription);
      res.json({
        success: true,
        transcription: transcription.transcription,
        parsedPayment: parsed.data
      });
    } else {
      res.status(400).json(transcription);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/text-to-speech', async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    const result = await voiceService.textToSpeech(text, voiceId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;