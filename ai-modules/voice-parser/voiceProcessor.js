const axios = require('axios');

class VoiceProcessor {
  constructor(apiKey) {
    this.elevenLabsApiKey = apiKey;
    this.baseURL = 'https://api.elevenlabs.io/v1';
  }

  /**
   * Convert speech to text using ElevenLabs
   * @param {Buffer} audioBuffer - Audio file buffer
   * @param {string} contentType - Audio content type
   * @returns {string} Transcribed text
   */
  async speechToText(audioBuffer, contentType = 'audio/mpeg') {
    try {
      // Note: ElevenLabs primarily does TTS, but we can use their voice similarity
      // For STT, we might use a different service or ElevenLabs if they support it
      // This is a placeholder implementation
      
      console.log('Converting speech to text...');
      
      // In a real implementation, you would call ElevenLabs STT API here
      // For hackathon demo, we'll simulate processing
      await this.simulateProcessing();
      
      // Mock transcription for demo purposes
      const mockTranscriptions = [
        "Pay John one hundred twenty USDC for website development",
        "Split five hundred dollars between Jane and Alex for design work",
        "Tip Sarah fifty USDC for the great logo design"
      ];
      
      const randomTranscription = mockTranscriptions[
        Math.floor(Math.random() * mockTranscriptions.length)
      ];
      
      return randomTranscription;
      
    } catch (error) {
      console.error('Speech to text conversion failed:', error);
      throw new Error('Voice processing unavailable');
    }
  }

  async simulateProcessing() {
    return new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Validate audio file
   * @param {Buffer} audioBuffer 
   * @param {string} contentType 
   */
  validateAudio(audioBuffer, contentType) {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4'];
    
    if (!validTypes.includes(contentType)) {
      throw new Error(`Unsupported audio format: ${contentType}`);
    }
    
    if (audioBuffer.length > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('Audio file too large. Maximum size is 10MB.');
    }
  }
}

module.exports = { VoiceProcessor };