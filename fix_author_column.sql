-- Fix the authorId column name issue in stories table
-- The application is looking for 'authorId' but the database might have a different column name

-- First check what author-related columns exist
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'stories' AND column_name LIKE '%author%'
ORDER BY ordinal_position;

-- Add the authorId column if it doesn't exist
ALTER TABLE stories ADD COLUMN IF NOT EXISTS "authorId" INTEGER;

-- If there's an existing author_id column, migrate the data
DO $$
BEGIN
    -- Check if author_id exists and migrate to authorId
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'author_id') THEN
        -- Since author_id is UUID and we need INTEGER, we'll use a hash function to convert
        -- Or assign a sequential number for each unique UUID
        WITH author_mapping AS (
            SELECT DISTINCT author_id, 
                   ROW_NUMBER() OVER (ORDER BY author_id) as author_int_id
            FROM stories 
            WHERE author_id IS NOT NULL AND author_id != ''
        )
        UPDATE stories 
        SET "authorId" = am.author_int_id
        FROM author_mapping am
        WHERE stories.author_id = am.author_id;
        
        -- For any remaining NULL or empty author_id values, set to 1
        UPDATE stories SET "authorId" = 1 WHERE "authorId" IS NULL;
    END IF;
END $$;

-- Make authorId NOT NULL with a default value for existing rows
UPDATE stories SET "authorId" = 1 WHERE "authorId" IS NULL;
ALTER TABLE stories ALTER COLUMN "authorId" SET NOT NULL;

-- Add other missing columns that the application expects
ALTER TABLE stories ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN DEFAULT FALSE;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN DEFAULT FALSE;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS "isShortStory" BOOLEAN DEFAULT FALSE;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT NOW();
ALTER TABLE stories ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW();

-- Migrate data from snake_case to camelCase columns if they exist
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stories_authorId ON stories("authorId");
CREATE INDEX IF NOT EXISTS idx_stories_isPublished ON stories("isPublished");

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the final schema - show all columns
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'stories' 
ORDER BY ordinal_position;
