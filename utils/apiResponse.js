/**
 * Standardized API Response Helper
 */
class ApiResponse {
  static success(res, message, data = null, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      error: null
    });
  }

  static error(res, message, statusCode = 500, errorDetails = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      data: null,
      error: errorDetails || message
    });
  }
}

module.exports = ApiResponse;
