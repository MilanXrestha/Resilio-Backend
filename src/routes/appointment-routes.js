const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment-controller');
const paymentController = require('../controllers/payment-controller');
const { authMiddleware } = require('../middlewares/auth-middleware');

router.post('/', authMiddleware, appointmentController.scheduleAppointment);
router.get('/:id', authMiddleware, appointmentController.getAppointment);
router.get('/', authMiddleware, appointmentController.listAppointments);

// Payments
router.post('/payment/verify', authMiddleware, paymentController.verifyPayment);

module.exports = router;
