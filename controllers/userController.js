const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/v1/users/profile
 * @access  Private
 */
exports.getUserProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return ApiResponse.error(res, 'User not found', 404);
  }
  return ApiResponse.success(res, 'User profile retrieved successfully', user, 200);
});

/**
 * @desc    Update current authenticated user profile & language preferences
 * @route   PUT /api/v1/users/profile
 * @access  Private
 */
exports.updateUserProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return ApiResponse.error(res, 'User not found', 404);
  }

  const { name, phone, preferredLanguage, state, occupation, incomeBracket, category } = req.body;

  if (name) user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (preferredLanguage) {
    if (!['en', 'hi', 'ta', 'te', 'mr'].includes(preferredLanguage)) {
      return ApiResponse.error(res, 'Invalid language selection', 400);
    }
    user.preferredLanguage = preferredLanguage;
  }
  if (state) user.state = state.trim();
  if (occupation) user.occupation = occupation.trim();
  if (incomeBracket) user.incomeBracket = incomeBracket;
  if (category) user.category = category;

  const updatedUser = await user.save();

  return ApiResponse.success(res, 'User profile updated successfully', updatedUser, 200);
});
