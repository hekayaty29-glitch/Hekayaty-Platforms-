-- Immediate fix for is_published column error
-- This uses the safest PostgreSQL syntax

-- Add is_published column to stories table
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.stories ADD COLUMN is_published BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_published column';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'is_published column already exists';
    END;
END $$;

-- Add is_premium column to stories table
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.stories ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_premium column';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'is_premium column already exists';
    END;
END $$;

-- Add published_at column to stories table
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.stories ADD COLUMN published_at TIMESTAMPTZ;
        RAISE NOTICE 'Added published_at column';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'published_at column already exists';
    END;
END $$;

-- Add subscription_end_date column to profiles table
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN subscription_end_date TIMESTAMPTZ;
        RAISE NOTICE 'Added subscription_end_date column';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'subscription_end_date column already exists';
    END;
END $$;

-- Make existing stories visible
UPDATE public.stories SET is_published = TRUE WHERE is_published IS NULL OR is_published = FALSE;
