const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const { generateToken } = require('../utils/jwt');

/**
 * @desc    Register a new citizen user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
exports.registerUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, confirmPassword, preferredLanguage, state, occupation, category } = req.body;

  if (!name || !email || !password) {
    return ApiResponse.error(res, 'Please provide name, email, and password', 400);
  }

  if (confirmPassword && password !== confirmPassword) {
    return ApiResponse.error(res, 'Passwords do not match', 400);
  }

  if (password.length < 6) {
    return ApiResponse.error(res, 'Password must be at least 6 characters long', 400);
  }

  const userExists = await User.findOne({ email: email.toLowerCase() });
  if (userExists) {
    return ApiResponse.error(res, 'User already exists with this email address', 400);
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    preferredLanguage: preferredLanguage || 'en',
    state: state || 'All India',
    occupation: occupation || 'General Citizen',
    category: category || 'General'
  });

  const token = generateToken(user._id);

  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    preferredLanguage: user.preferredLanguage,
    state: user.state,
    occupation: user.occupation,
    category: user.category,
    createdAt: user.createdAt
  };

  return ApiResponse.success(res, 'User registered successfully', { token, user: userData }, 201);
});

/**
 * @desc    Authenticate citizen user & get JWT token
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
exports.loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validation: Check fields
  if (!email || !password) {
    return ApiResponse.error(res, 'Please provide email and password', 400);
  }

  // Check if user exists (explicitly select password field)
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    return ApiResponse.error(res, 'Invalid credentials', 401);
  }

  // Verify password using bcrypt matchPassword instance method
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return ApiResponse.error(res, 'Invalid credentials', 401);
  }

  // Generate JWT Token
  const token = generateToken(user._id);

  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    preferredLanguage: user.preferredLanguage,
    state: user.state,
    occupation: user.occupation,
    category: user.category,
    createdAt: user.createdAt
  };

  return ApiResponse.success(res, 'Login successful', { token, user: userData }, 200);
});

/**
 * @desc    Get current logged in citizen profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  return ApiResponse.success(res, 'User profile retrieved successfully', user, 200);
});
