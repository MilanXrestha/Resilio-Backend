const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment-controller');
const paymentController = require('../controllers/payment-controller');
const messagesController = require('../controllers/appointment-messages-controller');
const { authMiddleware } = require('../middlewares/auth-middleware');
const { supabase } = require('../config/supabase-client');
const { fcmService } = require('../services/fcm-service');
const { NotificationService } = require('../services/notification-service');

router.post('/', authMiddleware, appointmentController.scheduleAppointment);
router.get('/', authMiddleware, appointmentController.listAppointments);

// Payments (must come before /:id to avoid conflict)
router.post('/payment/verify', authMiddleware, paymentController.verifyPayment);

// Conversation messages — shared across all appointments between same therapist+patient pair
router.get('/conversation/:therapistId/:patientId/messages', authMiddleware, messagesController.getConversationMessages);

// Messages per appointment
router.get('/:id/messages', authMiddleware, messagesController.getMessages);
router.post('/:id/messages', authMiddleware, messagesController.sendMessage);

// Patient → Therapist incoming call notification
router.post('/:id/call/notify', authMiddleware, async (req, res) => {
  try {
    const patientId = req.user?.id;
    if (!patientId) return res.status(401).json({ error: 'Unauthorized' });

    const { data: appt } = await supabase
      .from('appointments')
      .select('*, therapist:users!therapist_id(id, display_name, fcm_token), patient:users!patient_id(display_name)')
      .eq('id', req.params.id)
      .eq('patient_id', patientId)
      .single();

    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    const therapistToken = appt.therapist?.fcm_token;
    const patientName = appt.patient?.display_name || 'Your patient';
    const therapistId = appt.therapist_id || appt.therapist?.id;

    if (therapistToken) {
      await fcmService.notifyTherapistIncomingCall(therapistToken, appt, patientName);
    }

    // Persist in-app notification for therapist
    if (therapistId) {
      await NotificationService.create({
        userId: therapistId,
        title: `📞 ${patientName} is calling`,
        body: 'Tap to join the therapy session.',
        type: 'incoming_call',
        actionType: 'INCOMING_CALL',
        actionPayload: {
          appointmentId: req.params.id,
          roomId: appt.meeting_room_id || req.params.id,
          callerName: patientName,
        },
      }).catch(() => {});
    }

    res.json({ success: true, notified: !!therapistToken });
  } catch (err) {
    console.error('[Call Notify] error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authMiddleware, appointmentController.getAppointment);

module.exports = router;
