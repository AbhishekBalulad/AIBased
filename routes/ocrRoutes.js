const express = require('express');
const router = express.Router();
const { scanDocument } = require('../controllers/ocrController');

router.post('/scan', scanDocument);

module.exports = router;
