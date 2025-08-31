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

-- Fix clubs table - change from users to auth.users (using creator_id not founder_id)
ALTER TABLE public.clubs DROP CONSTRAINT IF EXISTS clubs_creator_id_fkey;
ALTER TABLE public.clubs 
ADD CONSTRAINT clubs_creator_id_fkey 
FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix club_members table - change from users to auth.users
ALTER TABLE public.club_members DROP CONSTRAINT IF EXISTS club_members_user_id_fkey;
ALTER TABLE public.club_members 
ADD CONSTRAINT club_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix workshops table - change creator_id from users to auth.users
ALTER TABLE public.workshops DROP CONSTRAINT IF EXISTS workshops_creator_id_fkey;
ALTER TABLE public.workshops 
ADD CONSTRAINT workshops_creator_id_fkey 
FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix workshop_participants table - change from users to auth.users
ALTER TABLE public.workshop_participants DROP CONSTRAINT IF EXISTS workshop_participants_user_id_fkey;
ALTER TABLE public.workshop_participants 
ADD CONSTRAINT workshop_participants_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
