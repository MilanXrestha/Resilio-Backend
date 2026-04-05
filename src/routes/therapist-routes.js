const express = require('express');
const router = express.Router();
const therapistController = require('../controllers/therapist-controller');
const { authMiddleware } = require('../middlewares/auth-middleware');

router.get('/', therapistController.listProfiles);
router.get('/:id', therapistController.getProfile);
router.get('/user/:userId', therapistController.getProfileByUserId);
router.post('/', authMiddleware, therapistController.createProfile);
router.put('/:id', authMiddleware, therapistController.updateProfile);
router.post('/match', therapistController.matchTherapists);

module.exports = router;
