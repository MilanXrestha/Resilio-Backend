-- Quotes table for Resilio wellness app
-- Run this in your Supabase SQL Editor

-- Create quotes table
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_text TEXT NOT NULL,
  author VARCHAR(255) NOT NULL,
  author_icon_url TEXT,
  category_id UUID REFERENCES public.categories(id),
  preference_ids UUID[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  quote_type VARCHAR(50) DEFAULT 'quote', -- 'quote', 'tip', 'affirmation'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Allow public read access (quotes are public content)
CREATE POLICY "Allow public read access" ON public.quotes
  FOR SELECT USING (true);

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated read" ON public.quotes
  FOR SELECT TO authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON public.quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_is_featured ON public.quotes(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_quotes_category_id ON public.quotes(category_id);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_type ON public.quotes(quote_type);
CREATE INDEX IF NOT EXISTS idx_quotes_preference_ids ON public.quotes USING GIN(preference_ids);

-- Insert sample featured quotes data
INSERT INTO public.quotes (quote_text, author, author_icon_url, category_id, preference_ids, is_featured, is_premium, quote_type) VALUES
  ('The heart was made to be broken', 'Oscar Wilde', 'https://sevenov.com/wp-content/uploads/2023/02/oscar-wilde-20230212.jpg', (SELECT id FROM public.categories WHERE name = 'Mindfulness'), '{}', true, false, 'quote'),
  ('The only way to do great work is to love what you do', 'Steve Jobs', 'https://resilio-cdn.com/authors/steve-jobs.jpg', (SELECT id FROM public.categories WHERE name = 'Mindfulness'), '{}', true, false, 'quote'),
  ('Life is what happens when you''re busy making other plans', 'John Lennon', 'https://resilio-cdn.com/authors/john-lennon.jpg', (SELECT id FROM public.categories WHERE name = 'Mindfulness'), '{}', true, false, 'quote'),
  ('The future belongs to those who believe in the beauty of their dreams', 'Eleanor Roosevelt', 'https://resilio-cdn.com/authors/eleanor-roosevelt.jpg', (SELECT id FROM public.categories WHERE name = 'Mindfulness'), '{}', true, false, 'quote'),
  ('It is during our darkest moments that we must focus to see the light', 'Aristotle', 'https://resilio-cdn.com/authors/aristotle.jpg', (SELECT id FROM public.categories WHERE name = 'Mindfulness'), '{}', true, false, 'quote'),
  ('In the middle of difficulty lies opportunity', 'Albert Einstein', 'https://resilio-cdn.com/authors/albert-einstein.jpg', (SELECT id FROM public.categories WHERE name = 'Stress Relief'), '{}', true, false, 'quote'),
  ('Happiness is not something ready made. It comes from your own actions', 'Dalai Lama', 'https://resilio-cdn.com/authors/dalai-lama.jpg', (SELECT id FROM public.categories WHERE name = 'Meditation'), '{}', true, false, 'quote'),
  ('What lies behind us and what lies before us are tiny matters compared to what lies within us', 'Ralph Waldo Emerson', 'https://resilio-cdn.com/authors/ralph-waldo-emerson.jpg', (SELECT id FROM public.categories WHERE name = 'Mindfulness'), '{}', true, false, 'quote');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
