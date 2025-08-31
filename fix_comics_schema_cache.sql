-- Fix comics table schema cache issue
-- The error suggests Supabase is still looking for 'cover_image' instead of 'cover_image_url'

-- First, let's ensure the comics table has the correct column name
ALTER TABLE public.comics 
DROP COLUMN IF EXISTS cover_image;

-- Ensure cover_image_url column exists
ALTER TABLE public.comics 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Refresh the schema cache by updating table comment
COMMENT ON TABLE public.comics IS 'Comics table - updated schema cache';

-- Also ensure all expected columns exist
ALTER TABLE public.comics 
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS workshop_id UUID REFERENCES public.workshops(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
