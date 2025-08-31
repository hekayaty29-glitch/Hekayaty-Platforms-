-- Delete all test stories for clean publishing
-- This will remove all stories with test-related titles

-- First, let's see what test stories exist:
SELECT id, title, author_id, placement, created_at 
FROM stories 
WHERE LOWER(title) LIKE '%test%' 
   OR LOWER(title) LIKE '%sdsad%'
   OR LOWER(title) = 'test'
   OR LOWER(title) = 'test 2'
   OR LOWER(title) = 'test 3'
   OR LOWER(title) = 'test 4'
   OR LOWER(title) = 'test 5'
   OR LOWER(title) = 'sdsadsadsadsdsad'
ORDER BY created_at DESC;

-- Delete all test stories (uncomment the lines below to execute):
-- DELETE FROM stories 
-- WHERE LOWER(title) LIKE '%test%' 
--    OR LOWER(title) LIKE '%sdsad%'
--    OR LOWER(title) = 'test'
--    OR LOWER(title) = 'test 2'
--    OR LOWER(title) = 'test 3'
--    OR LOWER(title) = 'test 4'
--    OR LOWER(title) = 'test 5'
--    OR LOWER(title) = 'sdsadsadsadsdsad';

-- Alternative: Delete by specific IDs if you know them
-- DELETE FROM stories WHERE id IN (
--   'story_id_1',
--   'story_id_2',
--   'story_id_3'
-- );

-- Verify deletion:
-- SELECT COUNT(*) as remaining_test_stories 
-- FROM stories 
-- WHERE LOWER(title) LIKE '%test%' OR LOWER(title) LIKE '%sdsad%';
