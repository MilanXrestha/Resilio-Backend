// Audio Routes
const express = require('express');
const audioController = require('../controllers/audio-controller');

const router = express.Router();

// Public routes - no authentication required
router.get('/featured', audioController.getFeaturedAudio);
router.get('/category/:categoryId', audioController.getAudioByCategory);
router.get('/:audioId', audioController.getAudioTrack);
router.post('/:audioId/play', audioController.incrementPlayCount);

module.exports = router;
