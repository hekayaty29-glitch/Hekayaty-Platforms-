-- Fix workshops table to add owner_id column
-- The code expects owner_id column to exist

-- Add owner_id column 
ALTER TABLE public.workshops 
ADD COLUMN IF NOT EXISTS owner_id UUID;
