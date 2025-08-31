-- Final comprehensive database schema fix for NovelNexus story publishing
-- This will align your database with the application code requirements

-- First, check current schema
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'stories' 
ORDER BY ordinal_position;

-- Add all required columns that the application expects
ALTER TABLE stories ADD COLUMN IF NOT EXISTS author_id TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS cover_url TEXT DEFAULT '';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS poster_url TEXT DEFAULT '';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS soundtrack_url TEXT DEFAULT '';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS extra_photos JSONB DEFAULT '[]';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN DEFAULT FALSE;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN DEFAULT FALSE;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS "isShortStory" BOOLEAN DEFAULT FALSE;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT NOW();
ALTER TABLE stories ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW();

-- Migrate data from existing columns if they exist
DO $$
BEGIN
    -- Migrate authorId to author_id if authorId exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'authorId') THEN
        UPDATE stories SET author_id = "authorId"::TEXT WHERE "authorId" IS NOT NULL;
    END IF;

    -- Migrate coverImage to cover_url if coverImage exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'coverImage') THEN
        UPDATE stories SET cover_url = "coverImage" WHERE "coverImage" IS NOT NULL;
    END IF;

    -- Migrate cover_image_url to cover_url if cover_image_url exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'cover_image_url') THEN
        UPDATE stories SET cover_url = cover_image_url WHERE cover_image_url IS NOT NULL;
    END IF;

    -- Migrate poster_image_url to poster_url if poster_image_url exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'poster_image_url') THEN
        UPDATE stories SET poster_url = poster_image_url WHERE poster_image_url IS NOT NULL;
    END IF;

    -- Migrate is_premium to isPremium
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'is_premium') THEN
        UPDATE stories SET "isPremium" = is_premium WHERE is_premium IS NOT NULL;
    END IF;

    -- Migrate is_published to isPublished
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'is_published') THEN
        UPDATE stories SET "isPublished" = is_published WHERE is_published IS NOT NULL;
    END IF;

    -- Migrate is_short_story to isShortStory
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'is_short_story') THEN
        UPDATE stories SET "isShortStory" = is_short_story WHERE is_short_story IS NOT NULL;
    END IF;

    -- Migrate created_at to createdAt
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'created_at') THEN
        UPDATE stories SET "createdAt" = created_at WHERE created_at IS NOT NULL;
    END IF;

    -- Migrate updated_at to updatedAt
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'updated_at') THEN
        UPDATE stories SET "updatedAt" = updated_at WHERE updated_at IS NOT NULL;
    END IF;
END $$;

-- Set default values for any NULL fields
UPDATE stories SET author_id = 'd78751c8-b749-4989-a5c4-3a1808011f11' WHERE author_id IS NULL OR author_id = '';
UPDATE stories SET cover_url = '' WHERE cover_url IS NULL;
UPDATE stories SET poster_url = '' WHERE poster_url IS NULL;
UPDATE stories SET soundtrack_url = '' WHERE soundtrack_url IS NULL;
UPDATE stories SET extra_photos = '[]' WHERE extra_photos IS NULL;
UPDATE stories SET status = 'draft' WHERE status IS NULL;
UPDATE stories SET "isPremium" = FALSE WHERE "isPremium" IS NULL;
UPDATE stories SET "isPublished" = FALSE WHERE "isPublished" IS NULL;
UPDATE stories SET "isShortStory" = FALSE WHERE "isShortStory" IS NULL;
UPDATE stories SET "createdAt" = NOW() WHERE "createdAt" IS NULL;
UPDATE stories SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;

-- Make author_id NOT NULL
ALTER TABLE stories ALTER COLUMN author_id SET NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stories_author_id ON stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_isPublished ON stories("isPublished");
CREATE INDEX IF NOT EXISTS idx_stories_isPremium ON stories("isPremium");
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_createdAt ON stories("createdAt");

-- Create a trigger to auto-update updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_stories_updated_at ON stories;
CREATE TRIGGER update_stories_updated_at
    BEFORE UPDATE ON stories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Verify final schema
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'stories' 
ORDER BY ordinal_position;
