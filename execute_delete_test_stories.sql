-- Execute deletion of all test stories based on database query results
-- Delete by specific IDs from the query results

DELETE FROM stories WHERE id IN (
  'd674bf02-7865-4777-8e3d-ba6b0f0abbce',  -- test 5
  '6325faf3-739c-45c2-a3c1-562d5a76b1d4',  -- test comics
  '7817fcc4-3264-4bee-a746-735563b8f80d',  -- sdsadsadsadsdsad
  '754cbe28-5bda-4388-8e84-a51d5d89fb28',  -- test4
  '841d22a9-4f8c-4f7d-a38d-ea3455e69f72',  -- test3
  'd3241d96-3092-4ff4-a491-34ab62deeb49',  -- test 2
  '2e2a1d38-7f7b-4799-b8bd-d6cf5ab421ce',  -- TEST (author_id: 01faacc1-4861-485f-80c8-3c128c0dd988)
  '35ff6884-38fa-4e82-ac46-92cc0bc237d4',  -- TEST (author_id: NULL)
  '791e91b3-1ac6-46a0-99ad-f44ad9efd5de',  -- TEST (author_id: NULL)
  '1268fd59-1153-44fb-b8a5-243d4b22cbd8',  -- TEST (author_id: NULL)
  '62ba56f3-5c6b-4522-83af-b97278136bca'   -- sadsdsadsadsadsadsadsadsads
);

-- Verify deletion
SELECT COUNT(*) as deleted_stories_count FROM stories 
WHERE id IN (
  'd674bf02-7865-4777-8e3d-ba6b0f0abbce',
  '6325faf3-739c-45c2-a3c1-562d5a76b1d4',
  '7817fcc4-3264-4bee-a746-735563b8f80d',
  '754cbe28-5bda-4388-8e84-a51d5d89fb28',
  '841d22a9-4f8c-4f7d-a38d-ea3455e69f72',
  'd3241d96-3092-4ff4-a491-34ab62deeb49',
  '2e2a1d38-7f7b-4799-b8bd-d6cf5ab421ce',
  '35ff6884-38fa-4e82-ac46-92cc0bc237d4',
  '791e91b3-1ac6-46a0-99ad-f44ad9efd5de',
  '1268fd59-1153-44fb-b8a5-243d4b22cbd8',
  '62ba56f3-5c6b-4522-83af-b97278136bca'
);

-- Check remaining stories in Hekayaty Originals
SELECT id, title, author_id, placement, created_at 
FROM stories 
WHERE placement = 'Hekayaty Originals'
ORDER BY created_at DESC;
