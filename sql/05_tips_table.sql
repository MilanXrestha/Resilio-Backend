-- Tips table for Resilio wellness app
-- Run this in your Supabase SQL Editor after 04_quotes_table.sql

-- Create tips table
CREATE TABLE IF NOT EXISTS public.tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  tip_text TEXT NOT NULL,
  author VARCHAR(255),
  author_icon_url TEXT,
  category_id UUID REFERENCES public.categories(id),
  preference_ids UUID[] DEFAULT '{}',
  tip_type VARCHAR(50) DEFAULT 'general', -- 'relationship_booster', 'letting_go', 'communication', 'self_care', 'mindfulness', 'general'
  is_featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;

-- Allow public read access (tips are public content)
CREATE POLICY "Allow public read access" ON public.tips
  FOR SELECT USING (true);

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated read" ON public.tips
  FOR SELECT TO authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tips_created_at ON public.tips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tips_is_featured ON public.tips(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_tips_category_id ON public.tips(category_id);
CREATE INDEX IF NOT EXISTS idx_tips_tip_type ON public.tips(tip_type);
CREATE INDEX IF NOT EXISTS idx_tips_preference_ids ON public.tips USING GIN(preference_ids);
CREATE INDEX IF NOT EXISTS idx_tips_sort_order ON public.tips(sort_order);

-- Insert sample tips data
INSERT INTO public.tips (title, tip_text, author, author_icon_url, category_id, preference_ids, tip_type, is_featured, is_premium, sort_order, metadata) VALUES

-- Relationship Boosters
('Practice Active Listening', 'When your partner speaks, focus entirely on understanding their message rather than planning your response. Make eye contact, nod, and ask clarifying questions.', 'Dr. John Gottman', 'https://resilio-cdn.com/authors/john-gottman.jpg', (SELECT id FROM public.categories WHERE name = 'Mindfulness'), '{}', 'relationship_booster', true, false, 1, '{"difficulty": "beginner", "duration_minutes": 5}'),

('Daily Appreciation', 'Share one specific thing you appreciate about your partner every day. Be detailed about why it matters to you.', 'Dr. Sue Johnson', 'https://resilio-cdn.com/authors/sue-johnson.jpg', (SELECT id FROM public.categories WHERE name = 'Mindfulness'), '{}', 'relationship_booster', true, false, 2, '{"difficulty": "beginner", "duration_minutes": 3}'),

('The 5:1 Ratio', 'Maintain at least five positive interactions for every negative one during conflicts. This ratio predicts relationship success.', 'Dr. John Gottman', 'https://resilio-cdn.com/authors/john-gottman.jpg', (SELECT id FROM public.categories WHERE name = 'Mindfulness'), '{}', 'relationship_booster', true, false, 3, '{"difficulty": "intermediate", "duration_minutes": 10}'),

-- Letting Go Tips
('Practice the Art of Release', 'Visualize holding a balloon representing what you''re holding onto. Watch it float away, acknowledging the feeling without attachment.', 'Tara Brach', 'https://resilio-cdn.com/authors/tara-brach.jpg', (SELECT id FROM public.categories WHERE name = 'Stress Relief'), '{}', 'letting_go', true, false, 1, '{"difficulty": "intermediate", "duration_minutes": 10}'),

('Write a Release Letter', 'Write down everything you''re holding onto, then safely burn or tear it up as a symbolic act of release.', 'Pema Chödrön', 'https://resilio-cdn.com/authors/pema-chodron.jpg', (SELECT id FROM public.categories WHERE name = 'Meditation'), '{}', 'letting_go', true, false, 2, '{"difficulty": "beginner", "duration_minutes": 15}'),

('Name It to Tame It', 'Label your emotions specifically: "I feel disappointed" or "I feel anxious." This reduces their intensity.', 'Dr. Dan Siegel', 'https://resilio-cdn.com/authors/dan-siegel.jpg', (SELECT id FROM public.categories WHERE name = 'Mindfulness'), '{}', 'letting_go', true, false, 3, '{"difficulty": "beginner", "duration_minutes": 5}'),

-- Communication Tips
('Use "I" Statements', 'Express feelings using "I feel..." instead of "You make me feel..." This reduces defensiveness and opens dialogue.', 'Marshall Rosenberg', 'https://resilio-cdn.com/authors/marshall-rosenberg.jpg', (SELECT id FROM public.categories WHERE name = 'Mindfulness'), '{}', 'communication', true, false, 1, '{"difficulty": "beginner", "duration_minutes": 5}'),

('The Pause Technique', 'Before responding in difficult conversations, take three deep breaths. This creates space for thoughtful responses.', 'Thich Nhat Hanh', 'https://resilio-cdn.com/authors/thich-nhat-hanh.jpg', (SELECT id FROM public.categories WHERE name = 'Meditation'), '{}', 'communication', true, false, 2, '{"difficulty": "beginner", "duration_minutes": 2}'),

-- Self-Care Tips
('Schedule Yourself', 'Block time in your calendar for self-care activities just as you would for important meetings. Honor these appointments.', 'Dr. Kristin Neff', 'https://resilio-cdn.com/authors/kristin-neff.jpg', (SELECT id FROM public.categories WHERE name = 'Stress Relief'), '{}', 'self_care', true, false, 1, '{"difficulty": "beginner", "duration_minutes": 30}'),

('The Oxygen Mask Rule', 'Remember: you must put on your own oxygen mask before helping others. Self-care isn''t selfish—it''s essential.', 'Brené Brown', 'https://resilio-cdn.com/authors/brene-brown.jpg', (SELECT id FROM public.categories WHERE name = 'Mindfulness'), '{}', 'self_care', true, false, 2, '{"difficulty": "beginner", "duration_minutes": 5}'),

-- Mindfulness Tips
('One-Minute Presence', 'Stop and notice: 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. Instant grounding.', 'Jon Kabat-Zinn', 'https://resilio-cdn.com/authors/jon-kabat-zinn.jpg', (SELECT id FROM public.categories WHERE name = 'Meditation'), '{}', 'mindfulness', true, false, 1, '{"difficulty": "beginner", "duration_minutes": 1}'),

('Breath as Anchor', 'When overwhelmed, focus on your breath for just 60 seconds. Don''t change it—just observe. This resets your nervous system.', 'Jack Kornfield', 'https://resilio-cdn.com/authors/jack-kornfield.jpg', (SELECT id FROM public.categories WHERE name = 'Meditation'), '{}', 'mindfulness', true, false, 2, '{"difficulty": "beginner", "duration_minutes": 1}');

-- Create or replace function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at for tips
DROP TRIGGER IF EXISTS update_tips_updated_at ON public.tips;
CREATE TRIGGER update_tips_updated_at
  BEFORE UPDATE ON public.tips
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();