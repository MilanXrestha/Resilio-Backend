const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/therapist-portal-controller');
const { authMiddleware } = require('../middlewares/auth-middleware');

// All routes require authentication
router.use(authMiddleware);

router.get('/dashboard', ctrl.getDashboardStats);
router.get('/appointments', ctrl.getAppointments);
router.patch('/appointments/:id/status', ctrl.updateAppointmentStatus);
router.get('/patients', ctrl.getPatients);
router.get('/patients/:patientId/moods', ctrl.getPatientMoods);
router.get('/earnings', ctrl.getEarnings);
router.get('/profile', ctrl.getProfile);
router.put('/profile', ctrl.updateProfile);
router.post('/call/notify', ctrl.notifyCall);

// Content CRUD
router.get('/content/tips', ctrl.getTips);
router.post('/content/tips', ctrl.createTip);
router.put('/content/tips/:id', ctrl.updateTip);
router.delete('/content/tips/:id', ctrl.deleteTip);

router.get('/content/quotes', ctrl.getQuotes);
router.post('/content/quotes', ctrl.createQuote);
router.put('/content/quotes/:id', ctrl.updateQuote);
router.delete('/content/quotes/:id', ctrl.deleteQuote);

router.get('/content/videos', ctrl.getVideos);
router.post('/content/videos', ctrl.createVideo);
router.put('/content/videos/:id', ctrl.updateVideo);
router.delete('/content/videos/:id', ctrl.deleteVideo);

router.get('/content/audio', ctrl.getAudio);
router.post('/content/audio', ctrl.createAudio);
router.put('/content/audio/:id', ctrl.updateAudio);
router.delete('/content/audio/:id', ctrl.deleteAudio);

module.exports = router;
