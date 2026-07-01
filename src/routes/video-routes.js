const express = require('express');
const { VideoController } = require('../controllers/video-controller');
const { VideoCommentController } = require('../controllers/video-comment-controller');
const { authMiddleware } = require('../middlewares/auth-middleware');

const router = express.Router();
const videoController = new VideoController();
const commentController = new VideoCommentController();

/**
 * Video routes
 * Base path: /api/v1/videos
 */

// Get all videos with filters
router.get('/', (req, res) => videoController.getVideos(req, res));

// Get short videos (reels)
router.get('/shorts', (req, res) => videoController.getShortVideos(req, res));

// Get long videos (therapy sessions)
router.get('/long', (req, res) => videoController.getLongVideos(req, res));

// Get featured videos
router.get('/featured', (req, res) => videoController.getFeaturedVideos(req, res));

// Get video by ID
router.get('/:id', (req, res) => videoController.getVideoById(req, res));

// Increment play count
router.post('/:id/play', (req, res) => videoController.incrementPlayCount(req, res));

// Comments — read is public, posting requires a valid session.
router.get('/:id/comments', (req, res) => commentController.getComments(req, res));
router.post('/:id/comments', authMiddleware, (req, res) => commentController.addComment(req, res));

module.exports = router;
