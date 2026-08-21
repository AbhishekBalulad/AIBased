const jwt = require('jsonwebtoken');

/**
 * Generate JWT Token for authenticated user
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'super_secret_jwt_key_ai_gov_policy_2026_secure', {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

module.exports = { generateToken };
