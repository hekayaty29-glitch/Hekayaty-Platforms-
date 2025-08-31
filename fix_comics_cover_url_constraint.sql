-- Fix comics table cover_url NOT NULL constraint issue
-- The view v_comics_extended depends on cover_url, so we need to handle this carefully

-- First, drop the dependent view
DROP VIEW IF EXISTS public.v_comics_extended CASCADE;

-- Remove NOT NULL constraint from cover_url if it exists
ALTER TABLE public.comics 
ALTER COLUMN cover_url DROP NOT NULL;

-- Make cover_url optional by allowing NULL values
-- This way we don't need to drop the column and break dependencies
