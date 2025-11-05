const { VoiceProcessor } = require('./voiceProcessor');
const chatParser = require('../chat-parser/parseChat');

class VoiceParser {
  constructor(apiKey = process.env.ELEVENLABS_API_KEY) {
    this.voiceProcessor = new VoiceProcessor(apiKey);
  }

  /**
   * Parse voice command for payment intent
   * @param {Buffer} audioBuffer - Audio file buffer
   * @param {string} contentType - Audio content type
   * @param {string} sender - Who sent the voice message
   * @returns {Object} Parsed payment intent
   */
  async parseVoiceCommand(audioBuffer, contentType, sender = 'Client') {
    try {
      console.log(`Processing voice command from ${sender}...`);
      
      // Validate audio file
      this.voiceProcessor.validateAudio(audioBuffer, contentType);
      
      // Convert speech to text
      const transcribedText = await this.voiceProcessor.speechToText(
        audioBuffer, 
        contentType
      );
      
      console.log('Transcribed text:', transcribedText);
      
      // Use chat parser on transcribed text
      const chatResult = await chatParser.parseChatMessage(transcribedText, sender);
      
      if (chatResult.success) {
        // Add voice-specific metadata
        chatResult.data.source = 'voice';
        chatResult.data.transcribedText = transcribedText;
        
        console.log('Voice command parsed successfully');
      }
      
      return chatResult;
      
    } catch (error) {
      console.error('Voice parsing failed:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Process multiple voice commands
   * @param {Array} voiceCommands - Array of {audio, contentType, sender} objects
   * @returns {Array} Results for all commands
   */
  async parseMultipleVoiceCommands(voiceCommands) {
    const results = [];
    
    for (const command of voiceCommands) {
      const result = await this.parseVoiceCommand(
        command.audio, 
        command.contentType, 
        command.sender
      );
      results.push(result);
    }
    
    return results;
  }
}

// Export singleton instance
module.exports = new VoiceParser();