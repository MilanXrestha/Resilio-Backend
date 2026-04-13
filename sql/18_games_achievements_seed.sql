-- Migration 18: Add game_id + sort_order to achievements, seed data
-- Run in Supabase SQL Editor

-- ── Schema additions ───────────────────────────────────────────────────────

ALTER TABLE achievements
  ADD COLUMN IF NOT EXISTS game_id TEXT NOT NULL DEFAULT 'global',
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 99;

CREATE INDEX IF NOT EXISTS idx_achievements_game_id ON achievements(game_id);

-- ── Seed achievements ──────────────────────────────────────────────────────
-- requirement_type values used by the backend auto-unlock logic:
--   'first_play'    → unlock after playing the game once
--   'sessions_game' → unlock after N sessions of a specific game
--   'sessions_total'→ unlock after N total game sessions across all games
--   'score'         → unlock when a single session score >= requirement_value

INSERT INTO achievements (code, name, description, icon_url, requirement_type, requirement_value, game_id, sort_order)
VALUES

  -- ── Breathing Game ───────────────────────────────────────────────────────
  ('FIRST_BREATH',      'First Breath',        'Complete your first Mindful Breathing session.',           '', 'first_play',    1,  'breathing_game', 1),
  ('BREATH_BEGINNER',   'Calm Beginner',        'Complete 3 Mindful Breathing sessions.',                  '', 'sessions_game', 3,  'breathing_game', 2),
  ('BREATH_EXPLORER',   'Breath Explorer',      'Complete 10 Mindful Breathing sessions.',                 '', 'sessions_game', 10, 'breathing_game', 3),
  ('BREATH_MASTER',     'Breath Master',        'Complete 25 Mindful Breathing sessions.',                 '', 'sessions_game', 25, 'breathing_game', 4),
  ('BREATH_SCORE_100',  'Sharp Focus',          'Score 100 points in a single breathing session.',         '', 'score',         100,'breathing_game', 5),

  -- ── Affirmation Builder ──────────────────────────────────────────────────
  ('FIRST_AFFIRMATION', 'Word Weaver',          'Complete your first Affirmation Builder session.',        '', 'first_play',    1,  'affirmation_builder', 10),
  ('AFF_STREAK_3',      'Positivity Seeker',    'Complete 3 Affirmation Builder sessions.',                '', 'sessions_game', 3,  'affirmation_builder', 11),
  ('AFF_STREAK_10',     'Affirmation Champion', 'Complete 10 Affirmation Builder sessions.',               '', 'sessions_game', 10, 'affirmation_builder', 12),
  ('AFF_SCORE_200',     'Word Master',          'Score 200 points in a single affirmation session.',       '', 'score',         200,'affirmation_builder', 13),

  -- ── Wellness Trivia ───────────────────────────────────────────────────────
  ('FIRST_TRIVIA',      'Curious Mind',         'Complete your first Wellness Trivia session.',            '', 'first_play',    1,  'wellness_quiz', 20),
  ('TRIVIA_3',          'Knowledge Seeker',     'Complete 3 Wellness Trivia sessions.',                    '', 'sessions_game', 3,  'wellness_quiz', 21),
  ('TRIVIA_10',         'Wellness Expert',      'Complete 10 Wellness Trivia sessions.',                   '', 'sessions_game', 10, 'wellness_quiz', 22),
  ('TRIVIA_PERFECT',    'Perfect Score',        'Score 50+ points in a single trivia session.',            '', 'score',         50, 'wellness_quiz', 23),

  -- ── Global / Cross-game ───────────────────────────────────────────────────
  ('GAMES_5',           'Game On',              'Play any 5 game sessions in total.',                      '', 'sessions_total', 5,  'global', 30),
  ('GAMES_20',          'Wellness Warrior',     'Play any 20 game sessions in total.',                     '', 'sessions_total', 20, 'global', 31),
  ('GAMES_50',          'Resilient Soul',       'Play any 50 game sessions in total.',                     '', 'sessions_total', 50, 'global', 32)

ON CONFLICT (code) DO UPDATE SET
  name             = EXCLUDED.name,
  description      = EXCLUDED.description,
  requirement_type = EXCLUDED.requirement_type,
  requirement_value= EXCLUDED.requirement_value,
  game_id          = EXCLUDED.game_id,
  sort_order       = EXCLUDED.sort_order;


-- ── Firestore: quiz_questions collection ──────────────────────────────────
-- The Wellness Trivia game reads from Firebase Firestore collection
-- "quiz_questions". If the collection is empty and Firestore rules block
-- client writes, the Flutter app now falls back to built-in questions
-- automatically (see wellness_quiz_screen.dart _builtInQuestions()).
--
-- To pre-populate via Firebase Admin SDK or Firestore console, create
-- documents in the "quiz_questions" collection with this structure:
--
--   question:           string
--   options:            array<string>   (4 items)
--   correctOptionIndex: number          (0-based)
--   explanation:        string
--   category:           string
--   difficulty:         number          (1=Easy, 2=Medium, 3=Hard)
--
-- Example doc ID: "q1"
-- {
--   "question": "What is mindfulness?",
--   "options": ["Being busy", "Focusing on the past", "Paying attention to the present moment", "Planning for the future"],
--   "correctOptionIndex": 2,
--   "explanation": "Mindfulness is the practice of purposely focusing your attention on the present moment.",
--   "category": "mindfulness",
--   "difficulty": 1
-- }


-- ── Firestore: affirmations collection ────────────────────────────────────
-- The Affirmation Builder reads from Firebase Firestore collection
-- "affirmations" filtering for docs that have a non-empty "words" array.
-- Flutter also falls back to built-in affirmations if Firestore is empty
-- or unavailable (see affirmation_builder_screen.dart _builtInAffirmations()).
--
-- To pre-populate, create documents in "affirmations" with this structure:
--
--   text:       string
--   words:      array<string>
--   category:   string
--   difficulty: number  (1-3)
--
-- Example:
-- {
--   "text": "I am strong and capable.",
--   "words": ["I", "am", "strong", "and", "capable"],
--   "category": "strength",
--   "difficulty": 1
-- }
