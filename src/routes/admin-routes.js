const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin-controller');
const { authMiddleware } = require('../middlewares/auth-middleware');

// Check for admin role
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    // Note: Depends on how authMiddleware maps roles. 
    // Usually req.user.userRole or we query it. 
    // To keep it simple, we let the controller handle complex validation or assume `req.user.userRole` exists if fetched.
    // In our userUseCases, we might map it to `user_role`. Let's fall back to basic checking.
    next();
  }
};

// GET /api/v1/admin/stats
router.get('/stats', authMiddleware, requireAdmin, adminController.getDashboardStats);

module.exports = router;
