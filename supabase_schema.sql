-- =====================================================
-- NOVELNEXUS COMPLETE SUPABASE BACKEND SCHEMA
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. USERS & AUTHENTICATION
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    bio TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    
    -- User roles and permissions
    role TEXT DEFAULT 'free' CHECK (role IN ('free', 'vip', 'admin')),
    is_premium BOOLEAN DEFAULT FALSE,
    is_author BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    
    -- Subscription details
    subscription_type TEXT DEFAULT 'free' CHECK (subscription_type IN ('free', '1_month', '2_month', '3_month', '6_month', '12_month')),
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    subscription_code TEXT,
    
    -- User stats
    tokens_balance INTEGER DEFAULT 0,
    downloads_used INTEGER DEFAULT 0,
    downloads_limit INTEGER DEFAULT 5,
    
    -- Profile settings
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'ar')),
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    
    -- Bans and moderation
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    banned_until TIMESTAMPTZ
);

-- =====================================================
-- 2. SUBSCRIPTION CODES SYSTEM
-- =====================================================

CREATE TABLE public.subscription_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    subscription_type TEXT NOT NULL CHECK (subscription_type IN ('1_month', '2_month', '3_month', '6_month', '12_month')),
    is_used BOOLEAN DEFAULT FALSE,
    used_by UUID REFERENCES public.users(id),
    created_by UUID REFERENCES public.users(id), -- Admin who created it
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Special 2-month codes that expire on Sept 22
    is_special_2month BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- 3. STORIES & CONTENT
-- =====================================================

-- Genres
CREATE TABLE public.genres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stories
CREATE TABLE public.stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL,
    cover_image_url TEXT,
    poster_image_url TEXT,
    
    -- Author and publishing
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    
    -- Story type and access
    is_premium BOOLEAN DEFAULT FALSE,
    is_short_story BOOLEAN DEFAULT FALSE,
    is_early_access BOOLEAN DEFAULT FALSE,
    
    -- Content format
    format TEXT DEFAULT 'html' CHECK (format IN ('html', 'pdf')),
    file_url TEXT, -- For PDF stories stored in Cloudinary
    
    -- Stats
    views_count INTEGER DEFAULT 0,
    downloads_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Story genres (many-to-many)
CREATE TABLE public.story_genres (
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
    genre_id UUID REFERENCES public.genres(id) ON DELETE CASCADE,
    PRIMARY KEY (story_id, genre_id)
);

-- =====================================================
-- 4. COMICS
-- =====================================================

CREATE TABLE public.comics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    cover_image_url TEXT,
    
    -- Author and publishing
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    
    -- Comic access
    is_premium BOOLEAN DEFAULT FALSE,
    
    -- Stats
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comic pages
CREATE TABLE public.comic_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comic_id UUID REFERENCES public.comics(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. RATINGS & REVIEWS
-- =====================================================

CREATE TABLE public.ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, story_id)
);

-- =====================================================
-- 6. BOOKMARKS
-- =====================================================

CREATE TABLE public.bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, story_id)
);

-- =====================================================
-- 7. COMMUNITY FEATURES
-- =====================================================

-- Clubs
CREATE TABLE public.clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    founder_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    logo_url TEXT,
    category TEXT DEFAULT 'General',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Club members
CREATE TABLE public.club_members (
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'founder')),
    PRIMARY KEY (club_id, user_id)
);

-- Club messages
CREATE TABLE public.club_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workshops
CREATE TABLE public.workshops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    cover_url TEXT,
    draft_content TEXT DEFAULT '',
    scheduled_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workshop participants
CREATE TABLE public.workshop_participants (
    workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (workshop_id, user_id)
);

-- Workshop messages
CREATE TABLE public.workshop_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community discussions
CREATE TABLE public.discussions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    category TEXT DEFAULT 'General',
    tags TEXT[] DEFAULT '{}',
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discussion replies
CREATE TABLE public.discussion_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discussion_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. NOTIFICATIONS
-- =====================================================

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'general' CHECK (type IN ('general', 'story', 'subscription', 'community', 'system')),
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 9. ADMIN FEATURES
-- =====================================================

-- Sponsored ads
CREATE TABLE public.sponsored_ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    link_url TEXT,
    placement TEXT NOT NULL CHECK (placement IN ('header', 'sidebar', 'footer', 'between_stories')),
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- News articles
CREATE TABLE public.news_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'general' CHECK (type IN ('general', 'community', 'hekayaty')),
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hall of Quills (Featured writers)
CREATE TABLE public.hall_of_quills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('active_writer', 'best_writer', 'competition_winner', 'honorable_mention')),
    title TEXT NOT NULL,
    description TEXT,
    achievement_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Legendary characters
CREATE TABLE public.legendary_characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    photo_url TEXT,
    short_description TEXT NOT NULL,
    full_bio TEXT NOT NULL,
    role TEXT DEFAULT 'Hero' CHECK (role IN ('Hero', 'Villain', 'Anti-Hero', 'Mentor', 'Sidekick')),
    origin TEXT NOT NULL,
    powers TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 10. REPORTS & MODERATION
-- =====================================================

CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('story', 'comment', 'user', 'discussion')),
    content_id UUID NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    reviewed_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- =====================================================
-- 11. ANALYTICS & STATS
-- =====================================================

CREATE TABLE public.user_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    stories_published INTEGER DEFAULT 0,
    comics_published INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    total_downloads INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 12. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON public.stories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comics_updated_at BEFORE UPDATE ON public.comics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON public.ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discussions_updated_at BEFORE UPDATE ON public.discussions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_news_articles_updated_at BEFORE UPDATE ON public.news_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_analytics_updated_at BEFORE UPDATE ON public.user_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check subscription validity
CREATE OR REPLACE FUNCTION is_subscription_valid(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = user_id 
        AND is_premium = TRUE 
        AND (subscription_end_date IS NULL OR subscription_end_date > NOW())
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can download
CREATE OR REPLACE FUNCTION can_user_download(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_record RECORD;
BEGIN
    SELECT downloads_used, downloads_limit, is_premium INTO user_record
    FROM public.users WHERE id = user_id;
    
    -- Premium users have unlimited downloads
    IF user_record.is_premium THEN
        RETURN TRUE;
    END IF;
    
    -- Free users check limit
    RETURN user_record.downloads_used < user_record.downloads_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comic_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsored_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hall_of_quills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legendary_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all public profiles" ON public.users FOR SELECT USING (profile_visibility = 'public' OR auth.uid() = auth_id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = auth_id);
CREATE POLICY "Admins can manage all users" ON public.users FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND is_admin = TRUE)
);

-- Stories policies
CREATE POLICY "Anyone can view published stories" ON public.stories FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Authors can manage own stories" ON public.stories FOR ALL USING (
    author_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
);
CREATE POLICY "Admins can manage all stories" ON public.stories FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND is_admin = TRUE)
);

-- Premium content access
CREATE POLICY "Premium stories access" ON public.stories FOR SELECT USING (
    is_published = TRUE AND (
        is_premium = FALSE OR 
        is_subscription_valid((SELECT id FROM public.users WHERE auth_id = auth.uid()))
    )
);

-- Ratings policies
CREATE POLICY "Users can view all ratings" ON public.ratings FOR SELECT USING (TRUE);
CREATE POLICY "Users can manage own ratings" ON public.ratings FOR ALL USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
);

-- Bookmarks policies
CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks FOR ALL USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
);

-- Community policies
CREATE POLICY "Anyone can view active clubs" ON public.clubs FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Club members can view club messages" ON public.club_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.club_members WHERE club_id = club_messages.club_id AND user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()))
);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
);

-- Admin-only policies
CREATE POLICY "Admin only access" ON public.subscription_codes FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "Admin only sponsored ads" ON public.sponsored_ads FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND is_admin = TRUE)
);

-- =====================================================
-- 14. INITIAL DATA SEEDING
-- =====================================================

-- Insert default genres
INSERT INTO public.genres (name, description, icon) VALUES
('Fantasy', 'Stories with magic, mythical creatures, and supernatural elements', 'fa-magic'),
('Romance', 'Stories focused on romantic relationships', 'fa-heart'),
('Mystery', 'Stories that involve solving a crime or puzzle', 'fa-mask'),
('Science Fiction', 'Stories based on scientific possibilities and technological advancements', 'fa-rocket'),
('Horror', 'Stories intended to frighten, scare, or disgust', 'fa-ghost'),
('Adventure', 'Stories that involve excitement, danger, and risk-taking', 'fa-mountain'),
('Comedy', 'Humorous and light-hearted stories', 'fa-laugh'),
('Drama', 'Serious stories dealing with realistic characters and situations', 'fa-theater-masks'),
('Thriller', 'Fast-paced stories designed to keep readers on edge', 'fa-bolt'),
('Historical', 'Stories set in the past', 'fa-scroll');

-- =====================================================
-- 15. INDEXES FOR PERFORMANCE
-- =====================================================

-- User indexes
CREATE INDEX idx_users_auth_id ON public.users(auth_id);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_subscription_end ON public.users(subscription_end_date);

-- Story indexes
CREATE INDEX idx_stories_author_id ON public.stories(author_id);
CREATE INDEX idx_stories_published ON public.stories(is_published);
CREATE INDEX idx_stories_premium ON public.stories(is_premium);
CREATE INDEX idx_stories_created_at ON public.stories(created_at DESC);
CREATE INDEX idx_stories_views ON public.stories(views_count DESC);

-- Community indexes
CREATE INDEX idx_club_members_user_id ON public.club_members(user_id);
CREATE INDEX idx_club_members_club_id ON public.club_members(club_id);
CREATE INDEX idx_workshop_participants_user_id ON public.workshop_participants(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read);

-- Rating and bookmark indexes
CREATE INDEX idx_ratings_story_id ON public.ratings(story_id);
CREATE INDEX idx_ratings_user_id ON public.ratings(user_id);
CREATE INDEX idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX idx_bookmarks_story_id ON public.bookmarks(story_id);

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================

-- This schema provides:
-- 1. Complete user management with roles and subscriptions
-- 2. Subscription code system with expiration (including special 2-month codes ending Sept 22)
-- 3. Stories and comics with premium access control
-- 4. Community features (clubs, workshops, discussions)
-- 5. Rating and bookmark system
-- 6. Admin features (ads, news, hall of quills)
-- 7. Notification system
-- 8. Reporting and moderation
-- 9. Analytics and user stats
-- 10. Comprehensive RLS policies for security
-- 11. Performance indexes
-- 12. Triggers for automatic timestamp updates
