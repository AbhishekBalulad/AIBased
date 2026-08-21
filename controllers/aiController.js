const asyncHandler = require('../middleware/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const aiService = require('../services/aiService');
const chatService = require('../services/chatService');
const translationService = require('../services/translationService');
const ttsService = require('../services/ttsService');

/**
 * @desc    Simplify complex government scheme legalese into citizen-friendly plain text
 * @route   POST /api/v1/ai/simplify
 * @access  Public / Authenticated
 */
exports.simplifyPolicy = asyncHandler(async (req, res, next) => {
  const { schemeId, targetLanguage = 'en' } = req.body;

  if (!schemeId) {
    return ApiResponse.error(res, 'Please provide schemeId in request body', 400);
  }

  const result = await aiService.simplifyGovtScheme(schemeId, targetLanguage);
  return ApiResponse.success(res, 'Policy simplified successfully', result, 200);
});

/**
 * @desc    Ask policy chatbot natural language question grounded in official schemes
 * @route   POST /api/v1/ai/chat
 * @access  Public / Authenticated
 */
exports.chatPolicy = asyncHandler(async (req, res, next) => {
  const { question, conversationId } = req.body;
  const userId = req.user ? req.user.id : '66c4a123f89e71b2d04a56e1';

  if (!question || !question.trim()) {
    return ApiResponse.error(res, 'Please provide a non-empty question in request body', 400);
  }

  const chatResult = await chatService.processUserMessage(userId, question.trim(), conversationId);
  return ApiResponse.success(res, 'AI answer generated successfully', chatResult, 200);
});

/**
 * @desc    Translate policy content or AI responses into selected language (en, hi, ta, te, mr)
 * @route   POST /api/v1/ai/translate
 * @access  Public / Authenticated
 */
exports.translateText = asyncHandler(async (req, res, next) => {
  const { text, targetLanguage = 'hi' } = req.body;

  if (!text || !text.trim()) {
    return ApiResponse.error(res, 'Please provide text parameter to translate', 400);
  }

  const translatedText = await translationService.translateText(text.trim(), targetLanguage);
  return ApiResponse.success(res, 'Text translated successfully', {
    originalText: text,
    targetLanguage,
    translatedText
  }, 200);
});

/**
 * @desc    Convert policy text or chatbot answers into spoken Text-to-Speech audio
 * @route   POST /api/v1/ai/tts
 * @access  Public / Authenticated
 */
exports.generateTtsAudio = asyncHandler(async (req, res, next) => {
  const { text, language = 'en' } = req.body;

  if (!text || !text.trim()) {
    return ApiResponse.error(res, 'Please provide text parameter for speech synthesis', 400);
  }

  const audioResult = await ttsService.generateSpeech(text.trim(), language);
  return ApiResponse.success(res, 'TTS audio generated successfully', audioResult, 200);
});
