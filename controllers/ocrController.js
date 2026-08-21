const asyncHandler = require('../middleware/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const ocrService = require('../services/ocrService');

/**
 * @desc    Upload document image & extract text using OCR service
 * @route   POST /api/v1/ocr/scan
 * @access  Public / Authenticated
 */
exports.scanDocument = asyncHandler(async (req, res, next) => {
  const userId = req.user ? req.user.id : '66c4a123f89e71b2d04a56e1';
  const { base64Image, fileName } = req.body;
  const imageFile = req.file || (fileName ? { originalname: fileName } : null);

  const scanResult = await ocrService.processDocumentImage(userId, imageFile, base64Image);
  return ApiResponse.success(res, 'Document scanned and text extracted successfully', scanResult, 200);
});
