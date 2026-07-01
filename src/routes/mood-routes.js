const express = require('express');
const ctrl = require('../controllers/mood-share-controller');
const { authMiddleware } = require('../middlewares/auth-middleware');

const router = express.Router();

// Patient must be authenticated; user derived from token (Supabase UUID).
router.use(authMiddleware);

router.get('/therapists', ctrl.listShareCandidates);
router.post('/share', ctrl.shareWithTherapist);
router.delete('/share/:therapistId', ctrl.revokeShare);
router.get('/shares', ctrl.listShares);

module.exports = router;
