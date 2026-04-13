-- Migration 19: quiz_questions and affirmation_puzzles tables
-- Run in Supabase SQL Editor

-- ── quiz_questions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    options JSONB NOT NULL,              -- array of 4 strings
    correct_option_index INTEGER NOT NULL CHECK (correct_option_index >= 0 AND correct_option_index <= 3),
    explanation TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 3),
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 99,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_category ON quiz_questions(category);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_difficulty ON quiz_questions(difficulty);

-- ── affirmation_puzzles ─────────────────────────────────────────────────────
-- Separate from the user-saved "affirmations" table. These are global puzzles.
CREATE TABLE IF NOT EXISTS affirmation_puzzles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    words JSONB NOT NULL,               -- array of strings to arrange
    category TEXT NOT NULL DEFAULT 'general',
    difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 3),
    background_color TEXT NOT NULL DEFAULT '0xFF6A5ACD',
    icon_name TEXT NOT NULL DEFAULT 'favorite',
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 99,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_affirmation_puzzles_difficulty ON affirmation_puzzles(difficulty);

-- Enable RLS
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affirmation_puzzles ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read (content is global, not user-specific)
CREATE POLICY "Authenticated users can read quiz questions"
    ON quiz_questions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can read affirmation puzzles"
    ON affirmation_puzzles FOR SELECT USING (true);


-- ═══════════════════════════════════════════════════════════════════════════
--  SEED DATA
-- ═══════════════════════════════════════════════════════════════════════════

-- ── quiz_questions seed ────────────────────────────────────────────────────
INSERT INTO quiz_questions (question, options, correct_option_index, explanation, category, difficulty, sort_order)
VALUES
  ('What is mindfulness?',
   '["Being busy with many tasks","Focusing on the past","Paying attention to the present moment","Planning for the future"]',
   2,
   'Mindfulness is the practice of purposely focusing your attention on the present moment—and accepting it without judgment.',
   'mindfulness', 1, 1),

  ('Which of these is NOT a benefit of regular exercise?',
   '["Reduced stress levels","Improved mood","Decreased metabolic rate","Better sleep quality"]',
   2,
   'Regular exercise actually increases your metabolic rate, helping you burn more calories throughout the day.',
   'physical', 1, 2),

  ('What is the recommended amount of sleep for adults?',
   '["4-5 hours","6-7 hours","7-9 hours","10-12 hours"]',
   2,
   'Most adults need 7-9 hours of sleep per night for optimal health and well-being.',
   'sleep', 1, 3),

  ('Which of these is a symptom of burnout?',
   '["Increased energy","Emotional exhaustion","Improved concentration","Higher productivity"]',
   1,
   'Burnout is characterized by emotional exhaustion, cynicism, and reduced professional efficacy.',
   'mental', 2, 4),

  ('What is the "5-4-3-2-1" technique used for?',
   '["Weight training","Time management","Grounding during anxiety","Dietary planning"]',
   2,
   'The 5-4-3-2-1 technique helps ground people during anxiety by identifying 5 things you see, 4 things you feel, 3 things you hear, 2 things you smell, and 1 thing you taste.',
   'mental', 2, 5),

  ('Which vitamin is primarily produced when skin is exposed to sunlight?',
   '["Vitamin A","Vitamin C","Vitamin D","Vitamin E"]',
   2,
   'Vitamin D is produced when UVB rays from the sun hit cholesterol in the skin cells.',
   'nutrition', 1, 6),

  ('What is the most effective way to reduce stress long-term?',
   '["Eliminating all stressors","Regular relaxation practices","Taking time off work","Avoiding difficult situations"]',
   1,
   'Developing regular relaxation practices like meditation or deep breathing provides sustainable stress management skills.',
   'stress', 2, 7),

  ('Which food is highest in antioxidants?',
   '["White bread","Blueberries","Chicken breast","White rice"]',
   1,
   'Blueberries are particularly high in antioxidants called anthocyanins, which give them their blue color.',
   'nutrition', 1, 8),

  ('What is the "flow state"?',
   '["A meditative breathing technique","A state of complete immersion and focus","The movement of energy in the body","A type of yoga practice"]',
   1,
   'Flow state describes complete immersion and focus in an activity, characterized by energized focus and enjoyment.',
   'mental', 3, 9),

  ('How much water should the average adult drink daily?',
   '["1-2 liters","2-3 liters","3-4 liters","It varies based on individual needs"]',
   3,
   'Water needs vary based on activity level, climate, health conditions, and other factors.',
   'nutrition', 2, 10),

  ('What does deep breathing activate in the body?',
   '["The fight-or-flight response","The parasympathetic nervous system","The sympathetic nervous system","The digestive system only"]',
   1,
   'Deep breathing activates the parasympathetic nervous system, triggering the body''s relaxation response.',
   'mindfulness', 2, 11),

  ('Which of these is a healthy coping mechanism for stress?',
   '["Overeating","Journaling your thoughts","Avoiding responsibilities","Sleeping excessively"]',
   1,
   'Journaling helps process emotions and reduce stress by externalizing your thoughts.',
   'mental', 1, 12),

  ('What is cognitive behavioral therapy (CBT) primarily used for?',
   '["Physical rehabilitation","Changing negative thought patterns","Improving memory","Medication management"]',
   1,
   'CBT focuses on identifying and changing negative thought patterns and behaviors that contribute to emotional problems.',
   'mental', 3, 13),

  ('Which practice is associated with reduced cortisol levels?',
   '["Watching TV before bed","Regular meditation","High-intensity cardio only","Working longer hours"]',
   1,
   'Regular meditation has been shown to significantly reduce cortisol, the primary stress hormone.',
   'stress', 2, 14),

  ('What is the benefit of gratitude journaling?',
   '["It replaces professional therapy","It improves mood and well-being","It eliminates all negative emotions","It solves external problems"]',
   1,
   'Research shows that regularly noting things you are grateful for shifts focus to positives and improves overall well-being.',
   'mindfulness', 1, 15),

  ('Which breathing technique is often used to calm anxiety quickly?',
   '["Hyperventilation","4-7-8 breathing","Holding breath for 2 minutes","Rapid shallow breathing"]',
   1,
   'The 4-7-8 technique (inhale 4s, hold 7s, exhale 8s) activates the parasympathetic nervous system and reduces anxiety.',
   'mindfulness', 2, 16),

  ('What is emotional regulation?',
   '["Suppressing all emotions","The ability to manage and respond to emotions effectively","Only feeling positive emotions","Avoiding emotional situations"]',
   1,
   'Emotional regulation is the ability to manage and respond to an emotional experience in a healthy, appropriate way.',
   'mental', 2, 17),

  ('Which of these is a sign of good mental health?',
   '["Never feeling sad","Ability to cope with stress","Avoiding all conflicts","Constant happiness"]',
   1,
   'Good mental health does not mean being happy all the time. It means having the ability to cope with life''s challenges.',
   'mental', 1, 18),

  ('What role does social connection play in mental wellness?',
   '["No significant role","It increases stress","It is a key protective factor against depression","It only matters for extroverts"]',
   2,
   'Strong social connections are one of the most significant protective factors against depression and anxiety.',
   'mental', 2, 19),

  ('How does regular physical activity affect brain function?',
   '["It decreases brain volume","It increases BDNF which supports neuron growth","It slows cognitive processing","It has no effect on the brain"]',
   1,
   'Exercise increases Brain-Derived Neurotrophic Factor (BDNF), which supports the growth and maintenance of neurons and improves mood.',
   'physical', 3, 20);


-- ── affirmation_puzzles seed ───────────────────────────────────────────────
INSERT INTO affirmation_puzzles (text, words, category, difficulty, background_color, icon_name, sort_order)
VALUES
  ('I am strong and capable.',
   '["I","am","strong","and","capable"]',
   'strength', 1, '0xFF6A5ACD', 'favorite', 1),

  ('I deserve love and happiness.',
   '["I","deserve","love","and","happiness"]',
   'self-love', 1, '0xFFE91E8C', 'favorite', 2),

  ('My mind is calm and peaceful.',
   '["My","mind","is","calm","and","peaceful"]',
   'mindfulness', 1, '0xFF2196F3', 'self_improvement', 3),

  ('I choose positivity today.',
   '["I","choose","positivity","today"]',
   'positivity', 1, '0xFFFF9800', 'wb_sunny', 4),

  ('I am grateful for this moment.',
   '["I","am","grateful","for","this","moment"]',
   'gratitude', 2, '0xFF4CAF50', 'volunteer_activism', 5),

  ('My potential is limitless.',
   '["My","potential","is","limitless"]',
   'growth', 1, '0xFF9C27B0', 'stars', 6),

  ('I embrace all my emotions.',
   '["I","embrace","all","my","emotions"]',
   'emotional-health', 2, '0xFF00BCD4', 'psychology', 7),

  ('Every day I am getting better.',
   '["Every","day","I","am","getting","better"]',
   'growth', 2, '0xFF8BC34A', 'trending_up', 8),

  ('I radiate confidence and grace.',
   '["I","radiate","confidence","and","grace"]',
   'confidence', 2, '0xFFF44336', 'emoji_emotions', 9),

  ('I trust my inner wisdom.',
   '["I","trust","my","inner","wisdom"]',
   'self-trust', 1, '0xFF607D8B', 'lightbulb', 10),

  ('I am worthy of good things.',
   '["I","am","worthy","of","good","things"]',
   'self-worth', 2, '0xFFFF5722', 'grade', 11),

  ('I create my own happiness.',
   '["I","create","my","own","happiness"]',
   'happiness', 1, '0xFFFFEB3B', 'sentiment_very_satisfied', 12),

  ('I am enough just as I am.',
   '["I","am","enough","just","as","I","am"]',
   'self-acceptance', 2, '0xFF3F51B5', 'self_improvement', 13),

  ('I choose to focus on the good.',
   '["I","choose","to","focus","on","the","good"]',
   'positivity', 3, '0xFF009688', 'wb_sunny', 14),

  ('I breathe in calm and peace.',
   '["I","breathe","in","calm","and","peace"]',
   'mindfulness', 1, '0xFF1565C0', 'air', 15),

  ('I release what I cannot control.',
   '["I","release","what","I","cannot","control"]',
   'mindfulness', 2, '0xFF00897B', 'self_improvement', 16),

  ('I attract positive energy daily.',
   '["I","attract","positive","energy","daily"]',
   'positivity', 2, '0xFFFFB300', 'bolt', 17),

  ('My thoughts shape my reality.',
   '["My","thoughts","shape","my","reality"]',
   'mindfulness', 3, '0xFF5E35B1', 'psychology', 18),

  ('I grow stronger through challenges.',
   '["I","grow","stronger","through","challenges"]',
   'growth', 3, '0xFF43A047', 'fitness_center', 19),

  ('I am at peace with who I am.',
   '["I","am","at","peace","with","who","I","am"]',
   'self-acceptance', 3, '0xFF0288D1', 'spa', 20);


-- ── Verify ─────────────────────────────────────────────────────────────────
-- SELECT COUNT(*) FROM quiz_questions;          -- should be 20
-- SELECT COUNT(*) FROM affirmation_puzzles;     -- should be 20
