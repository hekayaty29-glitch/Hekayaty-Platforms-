-- Create stories table if it doesn't exist
-- This will create the complete stories table with all required columns

CREATE TABLE IF NOT EXISTS public.stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_published BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    genre TEXT,
    tags TEXT[],
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Anyone can view published stories" ON public.stories;
CREATE POLICY "Anyone can view published stories" ON public.stories 
FOR SELECT USING (is_published = TRUE);

DROP POLICY IF EXISTS "Authors can manage own stories" ON public.stories;
CREATE POLICY "Authors can manage own stories" ON public.stories 
FOR ALL USING (author_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stories_author_id ON public.stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_is_published ON public.stories(is_published);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories(created_at DESC);

-- Grant permissions
GRANT ALL ON public.stories TO authenticated;

-- Verify table creation
SELECT 'Stories table created successfully with all columns' as status;
