const express = require('express');
const gamesController = require('../controllers/games-controller');
const { authMiddleware } = require('../middlewares/auth-middleware');

const router = express.Router();

// Apply auth middleware to all routes (handles both Firebase and SuperTokens)
router.use(authMiddleware);

// Games routes
router.post('/session', gamesController.saveGameSession);
router.get('/sessions', gamesController.listGameSessions);

// Mood tracking
router.post('/mood', gamesController.saveMoodEntry);
router.get('/mood', gamesController.listMoodEntries);

// Achievements
router.get('/achievements', gamesController.listUserAchievements);
router.get('/achievements/all', gamesController.listAllAchievements);

// Affirmations (user-saved)
router.post('/affirmations', gamesController.saveAffirmation);
router.get('/affirmations', gamesController.listAffirmations);
router.delete('/affirmations/:id', gamesController.deleteAffirmation);

// Game content (global, fetched by all users)
router.get('/quiz-questions', gamesController.listQuizQuestions);
router.get('/affirmation-puzzles', gamesController.listAffirmationPuzzles);

module.exports = router;
