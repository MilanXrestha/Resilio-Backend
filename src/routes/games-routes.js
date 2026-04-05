const express = require('express');
const { verifySession } = require('supertokens-node/recipe/session/framework/express');
const gamesController = require('../controllers/games-controller');
const { addUserInfo } = require('../middlewares/auth-middleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(verifySession());
router.use(addUserInfo);

// Games routes
router.post('/session', gamesController.saveGameSession);

// Mood tracking
router.post('/mood', gamesController.saveMoodEntry);
router.get('/mood', gamesController.listMoodEntries);

// Achievements
router.get('/achievements', gamesController.listUserAchievements);

// Affirmations
router.post('/affirmations', gamesController.saveAffirmation);
router.get('/affirmations', gamesController.listAffirmations);
router.delete('/affirmations/:id', gamesController.deleteAffirmation);

module.exports = router;
