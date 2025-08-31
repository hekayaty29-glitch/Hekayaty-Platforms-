-- Add placement and genre columns to stories table
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS placement TEXT,
ADD COLUMN IF NOT EXISTS genre TEXT[];

-- Update existing stories to have empty genre arrays if null
UPDATE stories SET genre = '{}' WHERE genre IS NULL;

-- Create index on placement for better query performance
CREATE INDEX IF NOT EXISTS idx_stories_placement ON stories(placement);

-- Create index on genre for better query performance  
CREATE INDEX IF NOT EXISTS idx_stories_genre ON stories USING GIN(genre);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
