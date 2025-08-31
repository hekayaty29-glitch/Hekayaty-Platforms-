-- Add scheduled publishing support
ALTER TABLE stories
ADD COLUMN IF NOT EXISTS publish_at TIMESTAMPTZ NULL;

-- Collaboration table: many-to-many authorship with role (author, editor, etc.)
CREATE TABLE IF NOT EXISTS story_collaborators (
  id SERIAL PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'co_author',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (story_id, user_id)
);

-- Maintain chapter version history
CREATE TABLE IF NOT EXISTS chapter_versions (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER NOT NULL REFERENCES story_chapters(id) ON DELETE CASCADE,
  version_no INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (chapter_id, version_no)
);

-- Ensure next version_no increments automatically (Postgres trigger example)
CREATE OR REPLACE FUNCTION increment_chapter_version_no()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version_no := COALESCE((SELECT MAX(version_no) FROM chapter_versions WHERE chapter_id = NEW.chapter_id), 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_version_no ON chapter_versions;
CREATE TRIGGER set_version_no BEFORE INSERT ON chapter_versions
FOR EACH ROW EXECUTE FUNCTION increment_chapter_version_no();

-- Expand acceptable file types stored in story_chapters (text column); if enum exists, alter enum instead
-- Example for enum:
-- ALTER TYPE chapter_file_type ADD VALUE IF NOT EXISTS 'audio';
-- ALTER TYPE chapter_file_type ADD VALUE IF NOT EXISTS 'image';
