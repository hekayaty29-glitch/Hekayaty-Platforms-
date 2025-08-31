-- Simple fix - Add missing columns one by one
-- Run this AFTER the debug script shows what's missing

-- Add is_published column to stories table
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;

-- Add is_premium column to stories table  
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- Add published_at column to stories table
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Add subscription_end_date column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;

-- Update existing stories to be published
UPDATE public.stories SET is_published = TRUE WHERE is_published IS NULL;

-- Verify the fix
SELECT 'Stories columns added successfully' as status;
