const express = require('express');
const router = express.Router();
const { getPolicyVideos } = require('../controllers/videoController');

router.get('/', getPolicyVideos);

module.exports = router;
