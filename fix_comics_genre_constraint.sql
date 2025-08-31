-- Fix comics table genre column NOT NULL constraint
-- The genre column cannot be null but our comic publishing doesn't send genre data

-- Remove NOT NULL constraint from genre column
ALTER TABLE public.comics 
ALTER COLUMN genre DROP NOT NULL;

-- Set a default empty array for genre if it's a JSON array type
-- or empty string if it's text type
UPDATE public.comics 
SET genre = '[]'::jsonb 
WHERE genre IS NULL;
