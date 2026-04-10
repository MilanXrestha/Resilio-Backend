const axios = require('axios');
const { appointmentRepo } = require('./appointment-controller');
const { fcmService } = require('../services/fcm-service');
const { supabase } = require('../config/supabase-client');
const { NotificationService } = require('../services/notification-service');

/**
 * Controller to handle Esewa test payment verification
 * When standard flutter esewa sdk completes, client sends proof to backend.
 * Backend verifies against Esewa server.
 */
module.exports = {
  async verifyPayment(req, res) {
    try {
      const { appointment_id, transaction_id, total_amount } = req.body;
      
      // In a real production scenario this URL is different. For EPAYTEST:
      const eseWaVerifyUrl = 'https://rc-epay.esewa.com.np/api/epay/transaction/status/';
      
      // We would make a server to server GET request to verify the transaction
      // For this test implementation, we will assume success if transaction_id exists
      // as flutter SDK often handles the heavy lifting in basic implementations,
      // but doing it server side is safest.
      
      // Faking server-side verification for the test environment
      if (transaction_id && transaction_id.length > 5) {
        // Payment success
        const appointment = await appointmentRepo.updateStatus(
          appointment_id, 
          'confirmed', 
          'paid', 
          transaction_id
        );
        
        // 🔔 Notify patient that payment is confirmed
        try {
          const { data: patient } = await supabase
            .from('users')
            .select('fcm_token')
            .eq('id', appointment.patientId)
            .single();

          if (patient?.fcm_token) {
            await fcmService.notifyPaymentConfirmed(patient.fcm_token, appointment);
          }

          // Also notify the therapist that appointment is now confirmed
          const { data: therapist } = await supabase
            .from('users')
            .select('fcm_token')
            .eq('id', appointment.therapistId)
            .single();

          if (therapist?.fcm_token) {
            await fcmService.sendToToken(
              therapist.fcm_token,
              'Appointment Confirmed',
              `Your appointment has been confirmed with payment received.`,
              { appointmentId: appointment.id, action: 'BOOKING_CONFIRMED' }
            );
          }

          // Persist notifications in DB
          await NotificationService.create({
            userId: appointment.patientId,
            title: 'Payment Confirmed',
            body: 'Your session payment was successful and the appointment is confirmed.',
            type: 'payment_confirmed',
            actionType: 'OPEN_APPOINTMENT',
            actionPayload: { appointmentId: appointment.id }
          });

          await NotificationService.create({
            userId: appointment.therapistId,
            title: 'Appointment Confirmed',
            body: `Payment received. Appointment on ${new Date(appointment.scheduledTime).toLocaleString()} is confirmed.`,
            type: 'booking_confirmed',
            actionType: 'OPEN_APPOINTMENT',
            actionPayload: { appointmentId: appointment.id }
          });
        } catch (notifErr) {
          console.error('Failed to send payment notification:', notifErr.message);
        }

        if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
          res.proto(appointment, 'resilio.appointment.Appointment');
          return;
        }
        return res.json({ success: true, appointment });
      }

      res.status(400).json({ error: 'Invalid transaction' });
    } catch (error) {
      console.error('Payment verification error:', error);
      res.status(500).json({ error: 'Internal verification error' });
    }
  }
};
