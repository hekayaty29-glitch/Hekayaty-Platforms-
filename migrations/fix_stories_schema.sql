-- Fix stories table schema - add missing is_published column
-- This migration adds the is_published column if it doesn't exist

-- Add is_published column to stories table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stories' 
        AND column_name = 'is_published'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.stories ADD COLUMN is_published BOOLEAN DEFAULT FALSE;
        
        -- Create index for performance
        CREATE INDEX IF NOT EXISTS idx_stories_is_published ON public.stories(is_published);
        
        -- Update existing stories to be published (assuming they should be visible)
        UPDATE public.stories SET is_published = TRUE WHERE is_published IS NULL;
        
        RAISE NOTICE 'Added is_published column to stories table';
    ELSE
        RAISE NOTICE 'is_published column already exists in stories table';
    END IF;
END $$;

-- Ensure other required columns exist
DO $$ 
BEGIN
    -- Add is_premium column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stories' 
        AND column_name = 'is_premium'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.stories ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
        CREATE INDEX IF NOT EXISTS idx_stories_is_premium ON public.stories(is_premium);
        RAISE NOTICE 'Added is_premium column to stories table';
    END IF;
    
    -- Add published_at column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stories' 
        AND column_name = 'published_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.stories ADD COLUMN published_at TIMESTAMPTZ;
        RAISE NOTICE 'Added published_at column to stories table';
    END IF;
END $$;
