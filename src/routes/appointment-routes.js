const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment-controller');
const paymentController = require('../controllers/payment-controller');
const messagesController = require('../controllers/appointment-messages-controller');
const { authMiddleware } = require('../middlewares/auth-middleware');

router.post('/', authMiddleware, appointmentController.scheduleAppointment);
router.get('/', authMiddleware, appointmentController.listAppointments);

// Payments (must come before /:id to avoid conflict)
router.post('/payment/verify', authMiddleware, paymentController.verifyPayment);

// Messages
router.get('/:id/messages', authMiddleware, messagesController.getMessages);
router.post('/:id/messages', authMiddleware, messagesController.sendMessage);

router.get('/:id', authMiddleware, appointmentController.getAppointment);

module.exports = router;
