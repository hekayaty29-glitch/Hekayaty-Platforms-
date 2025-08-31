-- Complete Database Fix for NovelNexus VIB System
-- Run this entire script in your Supabase SQL Editor

-- 1. Add is_published column to stories table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stories' 
        AND column_name = 'is_published' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.stories ADD COLUMN is_published BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_published column to stories table';
    ELSE
        RAISE NOTICE 'is_published column already exists in stories table';
    END IF;
END $$;

-- 2. Add is_premium column to stories table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stories' 
        AND column_name = 'is_premium' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.stories ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_premium column to stories table';
    ELSE
        RAISE NOTICE 'is_premium column already exists in stories table';
    END IF;
END $$;

-- 3. Add published_at column to stories table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stories' 
        AND column_name = 'published_at' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.stories ADD COLUMN published_at TIMESTAMPTZ;
        RAISE NOTICE 'Added published_at column to stories table';
    ELSE
        RAISE NOTICE 'published_at column already exists in stories table';
    END IF;
END $$;

-- 4. Add subscription_end_date column to profiles table for VIB system
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'subscription_end_date' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_end_date TIMESTAMPTZ;
        RAISE NOTICE 'Added subscription_end_date column to profiles table';
    ELSE
        RAISE NOTICE 'subscription_end_date column already exists in profiles table';
    END IF;
END $$;

-- 5. Update existing stories to be published (makes them visible)
UPDATE public.stories SET is_published = TRUE WHERE is_published IS FALSE OR is_published IS NULL;

-- 6. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_stories_is_published ON public.stories(is_published);
CREATE INDEX IF NOT EXISTS idx_stories_is_premium ON public.stories(is_premium);
CREATE INDEX IF NOT EXISTS idx_stories_published_at ON public.stories(published_at);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_end ON public.profiles(subscription_end_date);

-- 7. Create comics table if it doesn't exist
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

-- 8. Create indexes for comics table
CREATE INDEX IF NOT EXISTS idx_comics_author_id ON public.comics(author_id);
CREATE INDEX IF NOT EXISTS idx_comics_is_published ON public.comics(is_published);
CREATE INDEX IF NOT EXISTS idx_comics_created_at ON public.comics(created_at DESC);

-- 9. Enable RLS on comics table
ALTER TABLE public.comics ENABLE ROW LEVEL SECURITY;

-- 10. Create policies for comics (only after table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comics' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Anyone can view published comics" ON public.comics;
        CREATE POLICY "Anyone can view published comics" ON public.comics 
        FOR SELECT USING (is_published = TRUE);
        
        DROP POLICY IF EXISTS "Authors can manage own comics" ON public.comics;
        CREATE POLICY "Authors can manage own comics" ON public.comics 
        FOR ALL USING (author_id = auth.uid());
        
        RAISE NOTICE 'Created comics policies';
    END IF;
END $$;

-- 11. Grant necessary permissions
GRANT ALL ON public.stories TO authenticated;
GRANT ALL ON public.comics TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- 12. Verification - Check if all columns exist
DO $$
DECLARE
    stories_cols INTEGER;
    profiles_cols INTEGER;
    comics_exists BOOLEAN;
BEGIN
    -- Count required columns in stories table
    SELECT COUNT(*) INTO stories_cols
    FROM information_schema.columns 
    WHERE table_name = 'stories' 
    AND table_schema = 'public'
    AND column_name IN ('is_published', 'is_premium', 'published_at');
    
    -- Count required columns in profiles table
    SELECT COUNT(*) INTO profiles_cols
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND table_schema = 'public'
    AND column_name = 'subscription_end_date';
    
    -- Check if comics table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'comics' AND table_schema = 'public'
    ) INTO comics_exists;
    
    RAISE NOTICE 'Database setup verification:';
    RAISE NOTICE 'Stories table has % of 3 required columns', stories_cols;
    RAISE NOTICE 'Profiles table has % of 1 required column', profiles_cols;
    RAISE NOTICE 'Comics table exists: %', comics_exists;
    
    IF stories_cols = 3 AND profiles_cols = 1 AND comics_exists THEN
        RAISE NOTICE '✅ Database setup complete! VIB system ready.';
    ELSE
        RAISE NOTICE '❌ Database setup incomplete. Check missing components above.';
    END IF;
END $$;
