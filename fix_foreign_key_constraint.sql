-- Fix foreign key constraint for stories table
-- The constraint currently references users_legacy but should reference profiles (Supabase Auth table)

-- Drop the existing foreign key constraint
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_author_id_fkey;

-- Add new foreign key constraint referencing profiles table
ALTER TABLE public.stories 
ADD CONSTRAINT stories_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Alternative: If using profiles table instead of auth.users
-- ALTER TABLE public.stories 
-- ADD CONSTRAINT stories_author_id_fkey 
-- FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
