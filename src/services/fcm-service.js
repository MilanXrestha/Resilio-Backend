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
}

const fcmService = new FCMService();
module.exports = { fcmService, FCMService };
