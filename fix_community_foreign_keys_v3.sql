-- Fix foreign key constraints for community tables
-- The constraints currently reference users_legacy but should reference auth.users

-- Fix community_posts table
ALTER TABLE public.community_posts DROP CONSTRAINT IF EXISTS community_posts_user_id_fkey;
ALTER TABLE public.community_posts 
ADD CONSTRAINT community_posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix community_post_comments table
ALTER TABLE public.community_post_comments DROP CONSTRAINT IF EXISTS community_post_comments_user_id_fkey;
ALTER TABLE public.community_post_comments 
ADD CONSTRAINT community_post_comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix community_post_likes table if it exists
ALTER TABLE public.community_post_likes DROP CONSTRAINT IF EXISTS community_post_likes_user_id_fkey;
ALTER TABLE public.community_post_likes 
ADD CONSTRAINT community_post_likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix community_comment_likes table if it exists
ALTER TABLE public.community_comment_likes DROP CONSTRAINT IF EXISTS community_comment_likes_user_id_fkey;
ALTER TABLE public.community_comment_likes 
ADD CONSTRAINT community_comment_likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
