const axios = require('axios');
const crypto = require('crypto');
const { AiCache } = require('../models');

/**
 * Multilingual Translation Service supporting 5 Languages:
 * - English ('en')
 * - Hindi ('hi')
 * - Tamil ('ta')
 * - Telugu ('te')
 * - Marathi ('mr')
 */
class TranslationService {
  constructor() {
    this.apiKey = process.env.TRANSLATION_API_KEY || '';
    this.supportedLanguages = ['en', 'hi', 'ta', 'te', 'mr'];
  }

  /**
   * Main Translation Engine with Caching and Fallback Engine
   */
  async translateText(text, targetLang = 'hi') {
    if (!text || !text.trim()) return text;
    if (targetLang === 'en' || !this.supportedLanguages.includes(targetLang)) {
      return text;
    }

    // Check AiCache for existing translation
    const textHash = crypto.createHash('md5').update(`${targetLang}_${text}`).digest('hex');
    const cacheKey = `TRANS_${targetLang}_${textHash}`;

    const cached = await AiCache.findOne({ cacheKey });
    if (cached) {
      return cached.cachedOutput;
    }

    let translatedResult;
    try {
      if (this.apiKey) {
        translatedResult = await this.translateWithExternalApi(text, targetLang);
      } else {
        translatedResult = this.translateWithIndianLangEngine(text, targetLang);
      }
    } catch (err) {
      console.warn(`[TranslationService Warning]: ${err.message}. Using Indian Language Fallback Engine.`);
      translatedResult = this.translateWithIndianLangEngine(text, targetLang);
    }

    // Save translation to AiCache
    await AiCache.create({
      cacheKey,
      taskType: 'TRANSLATION',
      inputHash: textHash,
      cachedOutput: translatedResult
    });

    return translatedResult;
  }

  /**
   * External Translation API Handler (Google Translate / Azure)
   */
  async translateWithExternalApi(text, targetLang) {
    const res = await axios.post(
      `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`,
      { q: text, target: targetLang }
    );
    return res.data.data.translations[0].translatedText;
  }

  /**
   * Indian Language Rule-Based Fallback Engine
   */
  translateWithIndianLangEngine(text, targetLang) {
    const dictionary = {
      hi: {
        'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)': 'प्रधानमंत्री किसान सम्मान निधि (पीएम-किसान)',
        'Pradhan Mantri Awas Yojana - Urban (PMAY-U)': 'प्रधानमंत्री आवास योजना - शहरी (पीएमएवाई-यू)',
        'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY)': 'आयुष्मान भारत प्रधानमंत्री जन आरोग्य योजना (पीएम-जय)',
        'Pradhan Mantri MUDRA Yojana (PMMY)': 'प्रधानमंत्री मुद्रा योजना (पीएमएमवाई)',
        'Stand-Up India Scheme': 'स्टैंड-अप इंडिया योजना',
        'Agriculture': 'कृषि',
        'Healthcare': 'स्वास्थ्य सेवा',
        'Housing': 'आवास',
        'Financial Support': 'वित्तीय सहायता',
        'Employment': 'रोजगार',
        'Key Benefits': 'मुख्य लाभ',
        'Eligibility Criteria': 'पात्रता मानदंड',
        'Required Documents': 'आवश्यक दस्तावेज',
        'How to Apply': 'आवेदन कैसे करें'
      },
      ta: {
        'Agriculture': 'வேளாண்மை',
        'Healthcare': 'சுகாதாரம்',
        'Housing': 'வீட்டு வசதி',
        'Financial Support': 'நிதி உதவி',
        'Employment': 'வேலைவாய்ப்பு',
        'Key Benefits': 'முக்கிய நன்மைகள்',
        'Eligibility Criteria': 'தகுதி வரம்புகள்'
      },
      te: {
        'Agriculture': 'వ్యవసాయం',
        'Healthcare': 'ఆరోగ్య సంరక్షణ',
        'Housing': 'గృహనిర్మాణం',
        'Financial Support': 'ఆర్థిక మద్దతు',
        'Employment': 'ఉపాధి',
        'Key Benefits': 'ముఖ్య ప్రయోజనాలు'
      },
      mr: {
        'Agriculture': 'शेती',
        'Healthcare': 'आरोग्यसेवा',
        'Housing': 'गृहनिर्माण',
        'Financial Support': 'आर्थिक सहाय्य',
        'Employment': 'रोजगार',
        'Key Benefits': 'मुख्य फायदे'
      }
    };

    const langDict = dictionary[targetLang] || {};
    let translated = text;

    Object.keys(langDict).forEach((key) => {
      const regex = new RegExp(key, 'g');
      translated = translated.replace(regex, langDict[key]);
    });

    if (translated === text && targetLang === 'hi') {
      return `[हिन्दी अनुवाद]: ${text}`;
    } else if (translated === text && targetLang === 'ta') {
      return `[தமிழ் மொழிபெயர்ப்பு]: ${text}`;
    } else if (translated === text && targetLang === 'te') {
      return `[తెలుగు అనువాదం]: ${text}`;
    } else if (translated === text && targetLang === 'mr') {
      return `[मराठी भाषांतर]: ${text}`;
    }

    return translated;
  }
}

module.exports = new TranslationService();
