const { Feedback } = require('../models');
const asyncHandler = require('../middleware/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Submit new citizen feedback for policy, AI, translation, jobs, or app
 * @route   POST /api/v1/feedback
 * @access  Private
 */
exports.createFeedback = asyncHandler(async (req, res, next) => {
  const { feedbackType, rating, comment, targetRefId } = req.body;
  const userId = req.user.id;

  // Validation: Required fields
  if (!feedbackType || !rating) {
    return ApiResponse.error(res, 'Please provide feedbackType and a rating (1-5)', 400);
  }

  const validTypes = [
    'SCHEME_SIMPLIFICATION',
    'AI_CHATBOT',
    'TRANSLATION_QUALITY',
    'TTS_AUDIO',
    'OCR_SCANNER',
    'JOB_PORTAL',
    'FRAUD_DETECTION',
    'GENERAL_APP'
  ];

  if (!validTypes.includes(feedbackType)) {
    return ApiResponse.error(res, 'Invalid feedback category type', 400);
  }

  const ratingNum = parseInt(rating, 10);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return ApiResponse.error(res, 'Rating must be an integer between 1 and 5', 400);
  }

  const feedback = await Feedback.create({
    userId,
    feedbackType,
    rating: ratingNum,
    comment: comment ? comment.trim() : '',
    targetRefId: targetRefId || ''
  });

  return ApiResponse.success(res, 'Feedback submitted successfully. Thank you for your review!', feedback, 201);
});

/**
 * @desc    Get all submitted feedback for the authenticated citizen
 * @route   GET /api/v1/feedback/my
 * @access  Private
 */
exports.getMyFeedback = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const feedbackList = await Feedback.find({ userId }).sort({ createdAt: -1 });

  return ApiResponse.success(res, 'User feedback history retrieved successfully', {
    count: feedbackList.length,
    feedbackList
  }, 200);
});
