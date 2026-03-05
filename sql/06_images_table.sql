-- Images table for motivational wallpapers and inspirational images

CREATE TABLE IF NOT EXISTS public.images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  author VARCHAR(255),
  author_icon_url TEXT,
  category_id UUID REFERENCES public.categories(id),
  preference_ids UUID[] DEFAULT '{}',
  image_type VARCHAR(50) DEFAULT 'motivation', -- 'motivation', 'nature', 'quotes', 'abstract', 'spiritual', 'general'
  is_featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  resolution_width INTEGER,
  resolution_height INTEGER,
  file_size_bytes BIGINT,
  download_count INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_images_featured ON public.images(is_featured);
CREATE INDEX IF NOT EXISTS idx_images_type ON public.images(image_type);
CREATE INDEX IF NOT EXISTS idx_images_category ON public.images(category_id);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON public.images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_sort_order ON public.images(sort_order);
CREATE INDEX IF NOT EXISTS idx_images_premium ON public.images(is_premium);

-- Enable Row Level Security
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read access to featured images"
  ON public.images
  FOR SELECT
  USING (is_featured = true);

CREATE POLICY "Allow authenticated users to read all images"
  ON public.images
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin to manage images"
  ON public.images
  FOR ALL
  USING (auth.jwt()->>'role' = 'admin');

-- Insert sample motivational images
INSERT INTO public.images (title, description, image_url, thumbnail_url, author, image_type, is_featured, sort_order, metadata) VALUES
(
  'Mountain Sunrise',
  'Beautiful sunrise over mountain peaks to inspire your day',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&q=80',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80',
  'Nature Collection',
  'nature',
  true,
  1,
  '{"tags": ["mountains", "sunrise", "nature", "inspiration"], "photographer": "Unsplash"}'
),
(
  'Ocean Waves',
  'Calming ocean waves for peace and tranquility',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
  'Nature Collection',
  'nature',
  true,
  2,
  '{"tags": ["ocean", "waves", "peace", "calm"], "photographer": "Unsplash"}'
),
(
  'You Are Capable',
  'Motivational quote with beautiful typography',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1080&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
  'Motivation Hub',
  'motivation',
  true,
  3,
  '{"tags": ["motivation", "quotes", "inspiration", "success"], "designer": "Canva"}'
),
(
  'Believe in Yourself',
  'Empowering message to boost your confidence',
  'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1080&q=80',
  'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400&q=80',
  'Daily Motivation',
  'motivation',
  true,
  4,
  '{"tags": ["belief", "confidence", "motivation", "self-care"], "designer": "Canva"}'
),
(
  'Zen Garden',
  'Peaceful zen garden for mindfulness and meditation',
  'https://images.unsplash.com/photo-1580476262798-bddd9dd90e3e?w=1080&q=80',
  'https://images.unsplash.com/photo-1580476262798-bddd9dd90e3e?w=400&q=80',
  'Mindfulness Collection',
  'spiritual',
  true,
  5,
  '{"tags": ["zen", "meditation", "mindfulness", "peace"], "photographer": "Unsplash"}'
),
(
  'Abstract Harmony',
  'Colorful abstract art for creativity and inspiration',
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1080&q=80',
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&q=80',
  'Art Studio',
  'abstract',
  true,
  6,
  '{"tags": ["abstract", "art", "creativity", "colorful"], "artist": "Unsplash"}'
),
(
  'Forest Path',
  'Serene forest path inviting you on a journey',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1080&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80',
  'Nature Collection',
  'nature',
  true,
  7,
  '{"tags": ["forest", "path", "journey", "nature"], "photographer": "Unsplash"}'
),
(
  'Dream Big',
  'Inspirational message to chase your dreams',
  'https://images.unsplash.com/photo-1506784983877-45594efa6cbe?w=1080&q=80',
  'https://images.unsplash.com/photo-1506784983877-45594efa6cbe?w=400&q=80',
  'Motivation Hub',
  'motivation',
  true,
  8,
  '{"tags": ["dreams", "goals", "motivation", "success"], "designer": "Canva"}'
),
(
  'Starry Night Sky',
  'Beautiful starry night sky for wonder and contemplation',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1080&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=80',
  'Nature Collection',
  'nature',
  true,
  9,
  '{"tags": ["stars", "night", "sky", "wonder"], "photographer": "Unsplash"}'
),
(
  'Gratitude Changes Everything',
  'Powerful reminder about the importance of gratitude',
  'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1080&q=80',
  'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&q=80',
  'Daily Motivation',
  'motivation',
  true,
  10,
  '{"tags": ["gratitude", "thankful", "positivity", "mindset"], "designer": "Canva"}'
),
(
  'Lotus Flower',
  'Sacred lotus symbolizing purity and enlightenment',
  'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1080&q=80',
  'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&q=80',
  'Spiritual Arts',
  'spiritual',
  true,
  11,
  '{"tags": ["lotus", "enlightenment", "purity", "spiritual"], "photographer": "Unsplash"}'
),
(
  'Minimalist Calm',
  'Clean minimalist design for focus and clarity',
  'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=1080&q=80',
  'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=400&q=80',
  'Art Studio',
  'abstract',
  true,
  12,
  '{"tags": ["minimalist", "simple", "focus", "clarity"], "artist": "Unsplash"}'
);
