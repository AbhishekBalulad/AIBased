const express = require('express');
const router = express.Router();
const {
  syncSchemes,
  getSchemeSources,
  getFilterOptions,
  searchSchemes,
  getSchemes,
  getSchemeById
} = require('../controllers/schemeController');

router.post('/sync', syncSchemes);
router.get('/sources', getSchemeSources);
router.get('/filter-options', getFilterOptions);
router.get('/search', searchSchemes);
router.get('/', getSchemes);
router.get('/:id', getSchemeById);

module.exports = router;
