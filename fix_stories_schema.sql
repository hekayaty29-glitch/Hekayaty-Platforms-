-- Fix stories table schema to match the application requirements
-- This SQL will update the stories table to have the correct column names and types

-- First, let's see what columns currently exist
-- Run this to check current schema: \d stories

-- Add missing columns and rename existing ones to match the application
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS poster_image_url TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS author_id TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS workshop_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_short_story BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- If the table has different column names, we need to migrate data
-- Check if old columns exist and migrate data if needed

-- Update existing data if columns were renamed
DO $$
BEGIN
    -- Check if coverImage column exists and migrate to cover_image_url
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'coverImage') THEN
        UPDATE stories SET cover_image_url = "coverImage" WHERE "coverImage" IS NOT NULL;
        ALTER TABLE stories DROP COLUMN IF EXISTS "coverImage";
    END IF;

    -- Check if authorId column exists and migrate to author_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'authorId') THEN
        UPDATE stories SET author_id = "authorId"::TEXT WHERE "authorId" IS NOT NULL;
        ALTER TABLE stories DROP COLUMN IF EXISTS "authorId";
    END IF;

    -- Check if isPremium column exists and migrate to is_premium
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'isPremium') THEN
        UPDATE stories SET is_premium = "isPremium" WHERE "isPremium" IS NOT NULL;
        ALTER TABLE stories DROP COLUMN IF EXISTS "isPremium";
    END IF;

    -- Check if isPublished column exists and migrate to is_published
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'isPublished') THEN
        UPDATE stories SET is_published = "isPublished" WHERE "isPublished" IS NOT NULL;
        ALTER TABLE stories DROP COLUMN IF EXISTS "isPublished";
    END IF;

    -- Check if isShortStory column exists and migrate to is_short_story
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'isShortStory') THEN
        UPDATE stories SET is_short_story = "isShortStory" WHERE "isShortStory" IS NOT NULL;
        ALTER TABLE stories DROP COLUMN IF EXISTS "isShortStory";
    END IF;

    -- Check if createdAt column exists and migrate to created_at
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'createdAt') THEN
        UPDATE stories SET created_at = "createdAt" WHERE "createdAt" IS NOT NULL;
        ALTER TABLE stories DROP COLUMN IF EXISTS "createdAt";
    END IF;

    -- Check if updatedAt column exists and migrate to updated_at
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'updatedAt') THEN
        UPDATE stories SET updated_at = "updatedAt" WHERE "updatedAt" IS NOT NULL;
        ALTER TABLE stories DROP COLUMN IF EXISTS "updatedAt";
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stories_author_id ON stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_is_published ON stories(is_published);
CREATE INDEX IF NOT EXISTS idx_stories_workshop_id ON stories(workshop_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at);

-- Update the id column to use UUID if needed (optional, only if you want UUIDs)
-- ALTER TABLE stories ALTER COLUMN id TYPE UUID USING gen_random_uuid();

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the final schema
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'stories' 
ORDER BY ordinal_position;
