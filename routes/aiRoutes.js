const express = require('express');
const router = express.Router();
const { simplifyPolicy, chatPolicy, translateText, generateTtsAudio } = require('../controllers/aiController');

router.post('/simplify', simplifyPolicy);
router.post('/chat', chatPolicy);
router.post('/translate', translateText);
router.post('/tts', generateTtsAudio);

module.exports = router;
