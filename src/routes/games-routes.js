const express = require('express');
const gamesController = require('../controllers/games-controller');
const { authMiddleware } = require('../middlewares/auth-middleware');

const router = express.Router();

// Auth for all game routes. authMiddleware handles BOTH Firebase and
// SuperTokens tokens and resolves req.user.id to the Supabase users.id (UUID),
// which mood_entries.user_id references. (verifySession() only accepted
// SuperTokens tokens → Firebase/Google users got 401.)
router.use(authMiddleware);

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

// Game content
router.get('/quiz-questions', gamesController.listQuizQuestions);
router.get('/affirmation-puzzles', gamesController.listAffirmationPuzzles);

module.exports = router;
