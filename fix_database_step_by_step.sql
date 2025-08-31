-- Step-by-step database fix - Run each section separately
-- Copy and paste each section one at a time into Supabase SQL Editor

-- STEP 1: Add columns to stories table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'is_published' AND table_schema = 'public') THEN
        ALTER TABLE public.stories ADD COLUMN is_published BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_published column to stories';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'is_premium' AND table_schema = 'public') THEN
        ALTER TABLE public.stories ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_premium column to stories';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'published_at' AND table_schema = 'public') THEN
        ALTER TABLE public.stories ADD COLUMN published_at TIMESTAMPTZ;
        RAISE NOTICE 'Added published_at column to stories';
    END IF;
END $$;

-- STEP 2: Add subscription column to profiles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_end_date' AND table_schema = 'public') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_end_date TIMESTAMPTZ;
        RAISE NOTICE 'Added subscription_end_date column to profiles';
    END IF;
END $$;

-- STEP 3: Update existing stories
UPDATE public.stories SET is_published = TRUE WHERE is_published IS FALSE OR is_published IS NULL;

-- STEP 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_stories_is_published ON public.stories(is_published);
CREATE INDEX IF NOT EXISTS idx_stories_is_premium ON public.stories(is_premium);

-- STEP 5: Create comics table
CREATE TABLE IF NOT EXISTS public.comics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '[]',
    cover_image_url TEXT,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_premium BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 6: Enable RLS and create policies for comics
ALTER TABLE public.comics ENABLE ROW LEVEL SECURITY;

-- STEP 7: Create policies (only after table exists)
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
