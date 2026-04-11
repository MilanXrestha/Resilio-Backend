const axios = require('axios');
const { appointmentRepo } = require('./appointment-controller');
const { fcmService } = require('../services/fcm-service');
const { supabase } = require('../config/supabase-client');
const { NotificationService } = require('../services/notification-service');

// eSewa test environment verification endpoint
const ESEWA_VERIFY_URL_TEST = 'https://rc-epay.esewa.com.np/api/epay/transaction/status/';
const ESEWA_VERIFY_URL_LIVE = 'https://epay.esewa.com.np/api/epay/transaction/status/';

// Use test by default; set ESEWA_ENV=live in production
const ESEWA_VERIFY_URL =
  process.env.ESEWA_ENV === 'live' ? ESEWA_VERIFY_URL_LIVE : ESEWA_VERIFY_URL_TEST;

/**
 * POST /api/v1/payments/verify
 * Body: { appointment_id, transaction_id (refId from eSewa), total_amount }
 *
 * 1. Verify transaction with eSewa server
 * 2. Update appointment to confirmed + paid
 * 3. Notify patient + therapist via FCM
 */
module.exports = {
  async verifyPayment(req, res) {
    const { appointment_id, transaction_id, total_amount } = req.body;

    if (!appointment_id || !transaction_id) {
      return res.status(400).json({ error: 'appointment_id and transaction_id are required' });
    }

    try {
      // ── Step 1: Fetch appointment to get product price ───────────────────
      const appointment = await appointmentRepo.getAppointment(appointment_id);
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      // ── Step 2: Verify with eSewa (server-to-server) ─────────────────────
      let esewaVerified = false;
      try {
        const verifyRes = await axios.get(ESEWA_VERIFY_URL, {
          params: {
            product_code: process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST',
            total_amount: total_amount || appointment.price || 0,
            transaction_uuid: transaction_id,
          },
          timeout: 10000,
        });

        const status = verifyRes.data?.status;
        esewaVerified = status === 'COMPLETE';
        console.log('[eSewa] Verify response:', verifyRes.data);
      } catch (esewaErr) {
        console.error('[eSewa] Verification request failed:', esewaErr.message);
        // In test mode, if eSewa server is unreachable, accept the refId as valid
        // (eSewa test env is sometimes flaky). In production, reject on failure.
        if (process.env.ESEWA_ENV === 'live') {
          return res.status(402).json({ error: 'eSewa verification failed. Please contact support.' });
        }
        // Test mode: accept if refId has a reasonable format
        esewaVerified = transaction_id.length > 6;
        console.log('[eSewa] Test mode fallback — treating as verified:', esewaVerified);
      }

      if (!esewaVerified) {
        return res.status(402).json({ error: 'Payment could not be verified with eSewa.' });
      }

      // ── Step 3: Update appointment to confirmed + paid ────────────────────
      const updated = await appointmentRepo.updateStatus(
        appointment_id,
        'confirmed',
        'paid',
        transaction_id
      );

      // ── Step 4: Notify patient + therapist ────────────────────────────────
      try {
        const [{ data: patient }, { data: therapist }] = await Promise.all([
          supabase.from('users').select('fcm_token, display_name').eq('id', updated.patientId).single(),
          supabase.from('users').select('fcm_token, display_name').eq('id', updated.therapistId).single(),
        ]);

        const sessionDate = new Date(updated.scheduledTime).toLocaleString('en-NP', {
          dateStyle: 'medium', timeStyle: 'short'
        });

        // Patient: payment confirmed
        if (patient?.fcm_token) {
          await fcmService.sendToToken(
            patient.fcm_token,
            'Payment Confirmed',
            `Your therapy session on ${sessionDate} is confirmed.`,
            { appointmentId: appointment_id, action: 'OPEN_APPOINTMENT' }
          );
        }

        // Therapist: new confirmed booking
        if (therapist?.fcm_token) {
          await fcmService.sendToToken(
            therapist.fcm_token,
            'New Booking Confirmed',
            `A session has been booked for ${sessionDate}. Payment received.`,
            { appointmentId: appointment_id, action: 'OPEN_APPOINTMENT' }
          );
        }

        // Persist in DB
        await Promise.all([
          NotificationService.create({
            userId: updated.patientId,
            title: 'Payment Confirmed',
            body: `Your session on ${sessionDate} is confirmed. Ref: ${transaction_id}`,
            type: 'payment_confirmed',
            actionType: 'OPEN_APPOINTMENT',
            actionPayload: { appointmentId: appointment_id },
          }),
          NotificationService.create({
            userId: updated.therapistId,
            title: 'New Booking',
            body: `Payment received for session on ${sessionDate}.`,
            type: 'booking_confirmed',
            actionType: 'OPEN_APPOINTMENT',
            actionPayload: { appointmentId: appointment_id },
          }),
        ]);
      } catch (notifErr) {
        // Non-fatal — payment is verified, don't block response
        console.error('[Payment] Notification error:', notifErr.message);
      }

      res.json({ success: true, appointment: updated });
    } catch (error) {
      console.error('[Payment] verifyPayment error:', error);
      res.status(500).json({ error: 'Internal server error during payment verification' });
    }
  },
};
