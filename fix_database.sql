-- Manual Database Fix Script
-- Run this in your Supabase SQL editor to fix the missing columns

-- 1. Add missing columns to stories table one by one
DO $$ 
BEGIN
    -- Add is_published column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'is_published' AND table_schema = 'public') THEN
        ALTER TABLE public.stories ADD COLUMN is_published BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add is_premium column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'is_premium' AND table_schema = 'public') THEN
        ALTER TABLE public.stories ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add published_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'published_at' AND table_schema = 'public') THEN
        ALTER TABLE public.stories ADD COLUMN published_at TIMESTAMPTZ;
    END IF;
    
    -- Add is_short_story column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'is_short_story' AND table_schema = 'public') THEN
        ALTER TABLE public.stories ADD COLUMN is_short_story BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add format column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'format' AND table_schema = 'public') THEN
        ALTER TABLE public.stories ADD COLUMN format TEXT DEFAULT 'html' CHECK (format IN ('html', 'pdf'));
    END IF;
    
    -- Add file_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'file_url' AND table_schema = 'public') THEN
        ALTER TABLE public.stories ADD COLUMN file_url TEXT;
    END IF;
    
    -- Add views_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'views_count' AND table_schema = 'public') THEN
        ALTER TABLE public.stories ADD COLUMN views_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. Add missing columns to profiles table for subscription management
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_end_date' AND table_schema = 'public') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_end_date TIMESTAMPTZ;
    END IF;
END $$;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stories_is_published ON public.stories(is_published);
CREATE INDEX IF NOT EXISTS idx_stories_is_premium ON public.stories(is_premium);
CREATE INDEX IF NOT EXISTS idx_stories_published_at ON public.stories(published_at);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_end ON public.profiles(subscription_end_date);

-- 4. Update existing stories to be published (if you want them visible)
UPDATE public.stories SET is_published = TRUE WHERE is_published IS FALSE OR is_published IS NULL;

-- 5. Create comics table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.comics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '[]',
    cover_image_url TEXT,
    poster_image TEXT,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    workshop_id TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    views_count INTEGER DEFAULT 0
);

-- 6. Create indexes for comics table
CREATE INDEX IF NOT EXISTS idx_comics_author_id ON public.comics(author_id);
CREATE INDEX IF NOT EXISTS idx_comics_is_published ON public.comics(is_published);
CREATE INDEX IF NOT EXISTS idx_comics_created_at ON public.comics(created_at DESC);

-- 7. Enable RLS on comics table
ALTER TABLE public.comics ENABLE ROW LEVEL SECURITY;

-- 8. Create policies for comics
CREATE POLICY "Anyone can view published comics" ON public.comics 
FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Authors can manage own comics" ON public.comics 
FOR ALL USING (author_id = auth.uid());

-- 9. Grant necessary permissions
GRANT ALL ON public.stories TO authenticated;
GRANT ALL ON public.comics TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- Verification queries (run these to check if everything is working)
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'stories' AND table_schema = 'public';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles' AND table_schema = 'public';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'comics' AND table_schema = 'public';
