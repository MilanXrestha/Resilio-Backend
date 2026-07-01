-- 20_game_content.sql
-- Content tables the games read: wellness trivia questions + affirmation puzzles.

CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    options TEXT[] NOT NULL,
    correct_option_index INTEGER NOT NULL DEFAULT 0,
    explanation TEXT,
    category TEXT DEFAULT 'general',
    difficulty INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affirmation_puzzles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,           -- the full affirmation
    words TEXT[] NOT NULL,        -- shuffled word bank the user assembles
    background_color TEXT DEFAULT '0xFF6A5ACD',
    icon_name TEXT DEFAULT 'favorite',
    category TEXT DEFAULT 'general',
    difficulty INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Seed: wellness trivia ────────────────────────────────────────────────────
INSERT INTO quiz_questions (question, options, correct_option_index, explanation, category, difficulty) VALUES
('Which breathing technique helps calm anxiety fastest?',
 ARRAY['Rapid chest breathing','4-7-8 breathing','Holding your breath','Sighing repeatedly'], 1,
 '4-7-8 breathing activates the parasympathetic nervous system, slowing the heart rate.', 'breathing', 1),
('How many hours of sleep are recommended for most adults?',
 ARRAY['4-5 hours','6 hours','7-9 hours','10-12 hours'], 2,
 'Most adults need 7-9 hours for proper cognitive and emotional health.', 'sleep', 1),
('What is a healthy way to handle a stressful thought?',
 ARRAY['Suppress it','Name it and reframe it','Ignore it forever','Dwell on it'], 1,
 'Naming and reframing a thought reduces its emotional charge (a core CBT skill).', 'mindset', 2),
('Which of these boosts mood through movement?',
 ARRAY['Sitting still','A short walk','Skipping meals','Scrolling your phone'], 1,
 'Even a 10-minute walk releases endorphins and lifts mood.', 'wellness', 1),
('Gratitude journaling is linked to…',
 ARRAY['Worse sleep','Higher stress','Improved wellbeing','No effect'], 2,
 'Regular gratitude practice is associated with improved wellbeing and optimism.', 'mindset', 1),
('What does mindfulness primarily train?',
 ARRAY['Multitasking','Present-moment awareness','Faster typing','Memorization'], 1,
 'Mindfulness is the practice of non-judgmental present-moment awareness.', 'mindfulness', 1);

-- ── Seed: affirmation puzzles ────────────────────────────────────────────────
INSERT INTO affirmation_puzzles (text, words, background_color, icon_name, category, difficulty) VALUES
('I am calm and in control', ARRAY['I','am','calm','and','in','control'], '0xFF6A5ACD', 'self_improvement', 1),
('I choose peace today', ARRAY['I','choose','peace','today'], '0xFF34D399', 'spa', 1),
('I am worthy of good things', ARRAY['I','am','worthy','of','good','things'], '0xFFFBBF24', 'favorite', 2),
('My feelings are valid', ARRAY['My','feelings','are','valid'], '0xFF60A5FA', 'psychology', 1),
('I grow stronger every day', ARRAY['I','grow','stronger','every','day'], '0xFFF97316', 'trending_up', 2);
