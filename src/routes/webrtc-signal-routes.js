const express = require('express');
const router = express.Router();
const { emitSignal, pollSignals } = require('../controllers/webrtc-signal-controller');
const { authMiddleware } = require('../middlewares/auth-middleware');

// Both endpoints require auth so random devices can't spam the table.
router.post('/signal', authMiddleware, emitSignal);
router.get('/signal/:roomId', authMiddleware, pollSignals);

module.exports = router;
