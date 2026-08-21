const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const User = require('../models/User');

/**
 * Protect routes by verifying JWT Bearer token in Authorization header
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return ApiResponse.error(res, 'Not authorized to access this route, token missing', 401);
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_ai_gov_policy_2026_secure');

    // Attach user to request object (excluding password)
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return ApiResponse.error(res, 'User belonging to this token no longer exists', 401);
    }

    next();
  } catch (err) {
    return ApiResponse.error(res, 'Not authorized, invalid or expired token', 401);
  }
});

module.exports = { protect };
