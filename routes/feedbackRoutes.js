const express = require('express');
const router = express.Router();
const { createFeedback, getMyFeedback } = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');

// Protect all feedback endpoints
router.use(protect);

router.post('/', createFeedback);
router.get('/my', getMyFeedback);

module.exports = router;
