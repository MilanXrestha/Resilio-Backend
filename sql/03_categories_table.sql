-- Categories table for Resilio wellness app
-- Run this in your Supabase SQL Editor

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT,
  preference_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access (categories are public content)
CREATE POLICY "Allow public read access" ON public.categories
  FOR SELECT USING (true);

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated read" ON public.categories
  FOR SELECT TO authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_created_at ON public.categories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);

-- Insert sample categories data
INSERT INTO public.categories (name, image_url, description, preference_ids) VALUES
  ('Meditation', 'https://resilio-cdn.com/categories/meditation.png', 'Guided meditation sessions for mindfulness and relaxation', ARRAY['pref_meditation_1', 'pref_meditation_2', 'pref_meditation_3']),
  ('Sleep', 'https://resilio-cdn.com/categories/sleep.png', 'Sleep stories and sounds for better rest', ARRAY['pref_sleep_1', 'pref_sleep_2']),
  ('Music', 'https://resilio-cdn.com/categories/music.png', 'Calming music and soundscapes for relaxation', ARRAY['pref_music_1', 'pref_music_2', 'pref_music_3']),
  ('Breathing', 'https://resilio-cdn.com/categories/breathing.png', 'Breathing exercises for stress relief and relaxation', ARRAY['pref_breathing_1', 'pref_breathing_2']),
  ('Mindfulness', 'https://resilio-cdn.com/categories/mindfulness.png', 'Mindfulness practices for daily mental wellness', ARRAY['pref_mindfulness_1', 'pref_mindfulness_2']),
  ('Stress Relief', 'https://resilio-cdn.com/categories/stress-relief.png', 'Tools and techniques for managing stress', ARRAY['pref_stress_1', 'pref_stress_2', 'pref_stress_3']);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
