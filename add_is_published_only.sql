-- Simple SQL to add only is_published column to stories table
-- Run this in your Supabase SQL Editor

DO $$ 
BEGIN
    -- Add is_published column to stories table
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

-- Update existing stories to be published (optional - makes them visible)
UPDATE public.stories SET is_published = TRUE WHERE is_published IS FALSE OR is_published IS NULL;

-- Create index for performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_stories_is_published ON public.stories(is_published);
