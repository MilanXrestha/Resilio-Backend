// Images Routes - defines API endpoints
const express = require('express');
const imagesController = require('../controllers/images-controller');

const router = express.Router();

// Public routes - no authentication required for reading images
router.get('/featured', imagesController.getFeaturedImages);
router.get('/:id', imagesController.getImageById);
router.get('/', imagesController.listImages);
router.get('/type/:type', imagesController.getImagesByType);

// Admin routes (authentication/authorization should be added as middleware)
router.post('/', imagesController.createImage);
router.put('/:id', imagesController.updateImage);
router.delete('/:id', imagesController.deleteImage);

// Download tracking
router.post('/:id/download', imagesController.incrementDownloadCount);

module.exports = router;
