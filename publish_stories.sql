-- Publish existing stories in the database
UPDATE public.stories 
SET is_published = true, 
    published_at = NOW()
WHERE is_published = false OR is_published IS NULL;

-- Verify the update
SELECT id, title, is_published, published_at 
FROM public.stories 
ORDER BY created_at DESC;
