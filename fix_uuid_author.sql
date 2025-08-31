-- Fix UUID author_id to work with INTEGER authorId
-- Since your database has UUID author_id but the app expects INTEGER authorId

-- First, let's see what we're working with
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'stories' AND column_name LIKE '%author%'
ORDER BY ordinal_position;

-- Option 1: Keep author_id as TEXT (UUID) and update the application to use it
-- This is the recommended approach since UUIDs are better for user IDs

-- Add the missing columns with correct names that match your database
ALTER TABLE stories ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN DEFAULT FALSE;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN DEFAULT FALSE;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS "isShortStory" BOOLEAN DEFAULT FALSE;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT NOW();
ALTER TABLE stories ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW();

-- Migrate data from snake_case to camelCase if needed
DO $$
BEGIN
    -- is_premium to isPremium
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'is_premium') THEN
        UPDATE stories SET "isPremium" = is_premium WHERE is_premium IS NOT NULL;
    END IF;

    -- is_published to isPublished  
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'is_published') THEN
        UPDATE stories SET "isPublished" = is_published WHERE is_published IS NOT NULL;
    END IF;

    -- is_short_story to isShortStory
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'is_short_story') THEN
        UPDATE stories SET "isShortStory" = is_short_story WHERE is_short_story IS NOT NULL;
    END IF;

    -- created_at to createdAt
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'created_at') THEN
        UPDATE stories SET "createdAt" = created_at WHERE created_at IS NOT NULL;
    END IF;

    -- updated_at to updatedAt
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'updated_at') THEN
        UPDATE stories SET "updatedAt" = updated_at WHERE updated_at IS NOT NULL;
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stories_author_id ON stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_isPublished ON stories("isPublished");

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Show final schema
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'stories' 
ORDER BY ordinal_position;
