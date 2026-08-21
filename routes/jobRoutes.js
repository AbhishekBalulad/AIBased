const express = require('express');
const router = express.Router();
const {
  syncJobs,
  getJobSources,
  searchJobs,
  getJobListings,
  getJobById,
  analyzeJobFraud,
  saveJob,
  removeSavedJob,
  getSavedJobs
} = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');

router.post('/sync', syncJobs);
router.get('/sources', getJobSources);
router.get('/search', searchJobs);
router.post('/analyze-fraud', analyzeJobFraud);
router.get('/', getJobListings);
router.get('/saved', protect, getSavedJobs);
router.get('/:id', getJobById);

router.post('/:id/save', protect, saveJob);
router.delete('/:id/save', protect, removeSavedJob);

module.exports = router;
