-- Manual story deletion queries
-- Replace 'YOUR_USER_ID' with your actual user ID
-- Replace 'STORY_ID_TO_DELETE' with the specific story ID you want to delete

-- First, check which stories belong to you:
SELECT id, title, author_id, created_at 
FROM stories 
WHERE author_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;

-- To delete a specific story (replace STORY_ID_TO_DELETE with actual ID):
-- This will cascade delete related data automatically
DELETE FROM stories 
WHERE id = 'STORY_ID_TO_DELETE' 
AND author_id = 'YOUR_USER_ID';

-- To delete ALL your stories (use with caution!):
-- DELETE FROM stories WHERE author_id = 'YOUR_USER_ID';

-- Verify deletion:
SELECT COUNT(*) as remaining_stories 
FROM stories 
WHERE author_id = 'YOUR_USER_ID';
