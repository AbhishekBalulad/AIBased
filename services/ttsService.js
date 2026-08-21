const axios = require('axios');
const crypto = require('crypto');
const { AiCache } = require('../models');

/**
 * Text-to-Speech (TTS) Service
 * Converts text into spoken audio streams / URLs for accessible policy listening.
 */
class TtsService {
  constructor() {
    this.apiKey = process.env.TTS_API_KEY || '';
    this.supportedLanguages = ['en', 'hi', 'ta', 'te', 'mr'];
  }

  /**
   * Synthesize audio from text for simplified policy or chatbot answers
   */
  async generateSpeech(text, language = 'en') {
    if (!text || !text.trim()) {
      throw new Error('Text parameter is required for TTS synthesis');
    }

    const langCode = this.supportedLanguages.includes(language) ? language : 'en';

    // Hash text + language for cache lookup
    const textHash = crypto.createHash('md5').update(`${langCode}_${text}`).digest('hex');
    const cacheKey = `TTS_${langCode}_${textHash}`;

    const cached = await AiCache.findOne({ cacheKey });
    if (cached) {
      console.log(`[TtsService Cache Hit]: Returning cached audio URL for ${cacheKey}`);
      return cached.cachedOutput;
    }

    let audioResult;
    try {
      if (this.apiKey) {
        audioResult = await this.synthesizeWithExternalProvider(text, langCode);
      } else {
        audioResult = this.generateFallbackAudioUrl(text, langCode);
      }
    } catch (err) {
      console.warn(`[TtsService Warning]: ${err.message}. Using fallback TTS service.`);
      audioResult = this.generateFallbackAudioUrl(text, langCode);
    }

    // Save to AiCache
    await AiCache.create({
      cacheKey,
      taskType: 'TTS_GENERATION',
      inputHash: textHash,
      cachedOutput: audioResult
    });

    return audioResult;
  }

  /**
   * External TTS API Synthesizer (Google Cloud Text-to-Speech / Azure Speech)
   */
  async synthesizeWithExternalProvider(text, language) {
    const langMap = {
      en: 'en-IN-Wavenet-A',
      hi: 'hi-IN-Wavenet-A',
      ta: 'ta-IN-Wavenet-A',
      te: 'te-IN-Standard-A',
      mr: 'mr-IN-Standard-A'
    };

    const voiceName = langMap[language] || 'en-IN-Wavenet-A';

    const res = await axios.post(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`,
      {
        input: { text },
        voice: { languageCode: language, name: voiceName },
        audioConfig: { audioEncoding: 'MP3' }
      }
    );

    return {
      format: 'mp3',
      language,
      audioContent: res.data.audioContent, // Base64 encoded audio
      audioUrl: null
    };
  }

  /**
   * Fallback Audio Stream URL Generator using public open speech endpoint
   */
  generateFallbackAudioUrl(text, language) {
    const encodedText = encodeURIComponent(text.substring(0, 200));
    const langMap = { en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', mr: 'mr-IN' };
    const locale = langMap[language] || 'en-IN';

    // Standard public speech synthesis endpoint URL format
    const publicAudioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${language}&client=tw-ob`;

    return {
      format: 'mp3',
      language,
      locale,
      audioUrl: publicAudioUrl,
      durationEstimatedSec: Math.ceil(text.length / 15)
    };
  }
}

module.exports = new TtsService();
