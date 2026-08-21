const asyncHandler = require('../middleware/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const videoService = require('../services/videoService');

/**
 * @desc    Get policy explainer videos by schemeId and language
 * @route   GET /api/v1/videos
 * @access  Public
 */
exports.getPolicyVideos = asyncHandler(async (req, res, next) => {
  const { schemeId, language = 'hi' } = req.query;

  const result = await videoService.getPolicyVideos(schemeId, language);
  return ApiResponse.success(res, 'Policy explainer videos retrieved successfully', result, 200);
});
