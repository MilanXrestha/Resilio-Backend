const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin-controller');
const { authMiddleware } = require('../middlewares/auth-middleware');

// Admin-only. authMiddleware resolves req.user.role from the users table.
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ error: 'Admin access required' });
};

// Every admin route requires auth + admin role.
router.use(authMiddleware, requireAdmin);

router.get('/stats', adminController.getDashboardStats);

// Therapists
router.get('/therapists', adminController.getTherapists);
router.patch('/therapists/:therapistId/verify', adminController.verifyTherapist);
router.patch('/therapists/:therapistId/commission', adminController.updateTherapistCommission);
router.delete('/therapists/:therapistId', adminController.deleteTherapist);

// Users
router.get('/users', adminController.getUsers);
router.patch('/users/:userId/role', adminController.updateUserRole);
router.patch('/users/:userId/status', adminController.updateUserStatus);
router.delete('/users/:userId', adminController.deleteUser);

// Appointments
router.get('/appointments', adminController.getAppointments);

// Revenue & finance
router.get('/revenue', adminController.getRevenue);
router.get('/subscriptions', adminController.getSubscriptions);
router.get('/therapist-payments', adminController.getTherapistPayments);

// Generic content
router.get('/content', adminController.getContent);
router.delete('/content/:type/:contentId', adminController.deleteContent);

// Content CRUD per type
for (const seg of ['tips', 'quotes', 'audio', 'videos', 'images']) {
  router.get(`/${seg}`, adminController[`list_${seg}`]);
  router.post(`/${seg}`, adminController[`create_${seg}`]);
  router.put(`/${seg}/:id`, adminController[`update_${seg}`]);
  router.delete(`/${seg}/:id`, adminController[`delete_${seg}`]);
}

// Preferences / categories
router.get('/preferences', adminController.getPreferences);
router.post('/preferences', adminController.createPreference);
router.put('/preferences/:id', adminController.updatePreference);
router.delete('/preferences/:id', adminController.deletePreference);

// Notifications
router.post('/notifications/broadcast', adminController.broadcastNotification);
router.get('/notifications/history', adminController.getNotificationHistory);

module.exports = router;
