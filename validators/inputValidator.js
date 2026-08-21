const ApiResponse = require('../utils/apiResponse');

/**
 * Enterprise Input Sanitization & Validation Middleware
 */
class InputValidator {
  /**
   * Validate Email format
   */
  static validateEmail(email) {
    const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(String(email).toLowerCase());
  }

  /**
   * Middleware to sanitize and validate incoming JSON bodies
   */
  static sanitizeRequestBody(req, res, next) {
    if (req.body && typeof req.body === 'object') {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          // Trim whitespace & strip potential script injection tags
          req.body[key] = req.body[key].trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        }
      });
    }
    next();
  }
}

module.exports = InputValidator;
