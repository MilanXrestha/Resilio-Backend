const admin = require('firebase-admin');

// Ensure firebase-admin is initialized only once
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Vercel stores multiline env vars with escaped \n — fix before parsing
      const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n');
      const serviceAccount = JSON.parse(rawKey);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin initialized with provided service account.');
    } else {
      console.warn('FIREBASE_SERVICE_ACCOUNT_KEY not provided. FCM cannot send real pushes.');
    }
  } catch (error) {
    console.error('Firebase Admin init error:', error.message);
    // Do not rethrow — allow the server to start even if FCM is unavailable
  }
}

class FCMService {
  /**
   * Send a push notification to a specific token
   */
  async sendToToken(token, title, body, dataPayload = {}) {
    if (!admin.apps.length || !token) {
      console.log('Mock FCM Push:', { token, title, body, dataPayload });
      return false; // Not initialized or no token
    }

    try {
      const message = {
        notification: {
          title,
          body
        },
        data: dataPayload,
        token: token
      };

      const response = await admin.messaging().send(message);
      console.log('Successfully sent FCM message:', response);
      return true;
    } catch (error) {
      console.error('Error sending FCM message:', error);
      return false;
    }
  }

  /**
   * Notify therapist of a new booking
   */
  async notifyNewBooking(therapistFcmToken, appointment) {
    return this.sendToToken(
      therapistFcmToken,
      'New Appointment Booking',
      `You have a new appointment booked for ${new Date(appointment.scheduledTime).toLocaleString()}`,
      { appointmentId: appointment.id, action: 'NEW_BOOKING' }
    );
  }

  /**
   * Notify patient that payment is confirmed
   */
  async notifyPaymentConfirmed(patientFcmToken, appointment) {
    return this.sendToToken(
      patientFcmToken,
      'Payment Confirmed',
      'Your session payment was successful and the appointment is confirmed.',
      { appointmentId: appointment.id, action: 'PAYMENT_CONFIRMED' }
    );
  }

  /**
   * Notify THERAPIST of an incoming call from their patient (high priority)
   */
  async notifyTherapistIncomingCall(therapistFcmToken, appointment, patientName) {
    if (!admin.apps.length || !therapistFcmToken) {
      console.log('Mock FCM Therapist Call Push:', { therapistFcmToken, appointment });
      return false;
    }
    try {
      const message = {
        notification: {
          title: `📞 ${patientName || 'Your patient'} is calling`,
          body: 'Tap to join the therapy session.',
        },
        data: {
          appointmentId: String(appointment.id),
          roomId: String(appointment.meetingRoomId || appointment.meeting_room_id || appointment.id),
          action: 'INCOMING_CALL',
          callerName: patientName || 'Patient',
        },
        android: {
          priority: 'high',
          notification: { priority: 'max', channelId: 'resilio_calls' },
        },
        apns: {
          headers: { 'apns-priority': '10' },
          payload: { aps: { sound: 'default', badge: 1 } },
        },
        token: therapistFcmToken,
      };
      const response = await admin.messaging().send(message);
      console.log('Therapist incoming call FCM sent:', response);
      return true;
    } catch (error) {
      console.error('Error sending therapist incoming call FCM:', error);
      return false;
    }
  }

  /**
   * Notify patient of an incoming call from their therapist (high priority)
   */
  async notifyIncomingCall(patientFcmToken, appointment, therapistName) {
    if (!admin.apps.length || !patientFcmToken) {
      console.log('Mock FCM Incoming Call Push:', { patientFcmToken, appointment });
      return false;
    }
    try {
      const message = {
        notification: {
          title: `📞 ${therapistName || 'Your therapist'} is calling`,
          body: 'Tap to join your therapy session now.',
        },
        data: {
          appointmentId: String(appointment.id),
          roomId: String(appointment.meetingRoomId || appointment.meeting_room_id || ''),
          action: 'INCOMING_CALL',
        },
        android: {
          priority: 'high',
          notification: { priority: 'max', channelId: 'resilio_calls' },
        },
        apns: {
          headers: { 'apns-priority': '10' },
          payload: { aps: { sound: 'default', badge: 1 } },
        },
        token: patientFcmToken,
      };
      const response = await admin.messaging().send(message);
      console.log('Incoming call FCM sent:', response);
      return true;
    } catch (error) {
      console.error('Error sending incoming call FCM:', error);
      return false;
    }
  }
}

const fcmService = new FCMService();
module.exports = { fcmService, FCMService };
