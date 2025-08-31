-- =====================================================
-- NOVELNEXUS COMPREHENSIVE POSTGRESQL SCHEMA
-- Compatible with Supabase
-- Generated: 2025-07-25
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CUSTOM TYPES AND ENUMS
-- =====================================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('anonymous', 'authenticated', 'vip', 'admin', 'superadmin');

-- User status enum
CREATE TYPE user_status AS ENUM ('active', 'banned', 'suspended', 'pending');

-- Story status enum
CREATE TYPE story_status AS ENUM ('draft', 'published', 'archived', 'deleted');

-- Subscription status enum
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled', 'pending');

-- Payment status enum
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Payment method enum
CREATE TYPE payment_method AS ENUM ('vodafone', 'paypal', 'fawry', 'stripe');

-- Notification type enum
CREATE TYPE notification_type AS ENUM ('story_like', 'story_comment', 'follow', 'mention', 'system', 'achievement');

-- Report status enum
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');

-- Content type enum for reports
CREATE TYPE content_type AS ENUM ('story', 'comment', 'user', 'forum_post', 'artwork');

-- Workshop status enum
CREATE TYPE workshop_status AS ENUM ('upcoming', 'ongoing', 'completed', 'cancelled');

-- Club privacy enum
CREATE TYPE club_privacy AS ENUM ('public', 'private', 'invite_only');

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    bio TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    role user_role DEFAULT 'authenticated',
    status user_status DEFAULT 'active',
    is_premium BOOLEAN DEFAULT FALSE,
    is_author BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    premium_expires_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (extended user information)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    website_url TEXT,
    twitter_handle VARCHAR(50),
    instagram_handle VARCHAR(50),
    facebook_url TEXT,
    linkedin_url TEXT,
    location VARCHAR(255),
    birth_date DATE,
    preferred_language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50),
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    privacy_settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User statistics
CREATE TABLE public.user_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    stories_published INTEGER DEFAULT 0,
    words_written INTEGER DEFAULT 0,
    bookmarks_received INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    total_likes_received INTEGER DEFAULT 0,
    total_comments_received INTEGER DEFAULT 0,
    reading_streak_days INTEGER DEFAULT 0,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User follows
CREATE TABLE public.follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- =====================================================
-- STORY MANAGEMENT TABLES
-- =====================================================

-- Genres
CREATE TABLE public.genres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags
CREATE TABLE public.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    usage_count INTEGER DEFAULT 0,
    is_trending BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stories
CREATE TABLE public.stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    content TEXT,
    cover_url TEXT,
    poster_url TEXT,
    soundtrack_url TEXT,
    extra_photos JSONB DEFAULT '[]',
    status story_status DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    reading_time_minutes INTEGER DEFAULT 0,
    word_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Story genres (many-to-many)
CREATE TABLE public.story_genres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
    genre_id UUID REFERENCES public.genres(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(story_id, genre_id)
);

-- Story tags (many-to-many)
CREATE TABLE public.story_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(story_id, tag_id)
);

-- Chapters
CREATE TABLE public.chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    chapter_number INTEGER NOT NULL,
    word_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(story_id, chapter_number)
);

-- Scenes (within chapters)
CREATE TABLE public.scenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
    title VARCHAR(500),
    content TEXT,
    scene_number INTEGER NOT NULL,
    word_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(chapter_id, scene_number)
);

-- Story ratings and reviews
CREATE TABLE public.ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(story_id, user_id)
);

-- Story bookmarks
CREATE TABLE public.bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(story_id, user_id)
);

-- Story likes
CREATE TABLE public.story_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(story_id, user_id)
);

-- Story comments
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment likes
CREATE TABLE public.comment_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- =====================================================
-- SUBSCRIPTION SYSTEM TABLES
-- =====================================================

-- Subscription plans
CREATE TABLE public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    duration_months INTEGER NOT NULL,
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.subscription_plans(id),
    status subscription_status DEFAULT 'pending',
    starts_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promo codes
CREATE TABLE public.promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promo code redemptions
CREATE TABLE public.promo_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id),
    redeemed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(promo_code_id, user_id)
);

-- Payments
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method payment_method NOT NULL,
    payment_provider_id VARCHAR(255),
    status payment_status DEFAULT 'pending',
    transaction_data JSONB DEFAULT '{}',
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COMMUNITY FEATURES TABLES
-- =====================================================

-- Clubs
CREATE TABLE public.clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover_url TEXT,
    privacy club_privacy DEFAULT 'public',
    creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    member_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Club memberships
CREATE TABLE public.club_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(club_id, user_id)
);

-- Forums
CREATE TABLE public.forums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT TRUE,
    thread_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum threads
CREATE TABLE public.forum_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    forum_id UUID REFERENCES public.forums(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    last_reply_at TIMESTAMPTZ,
    last_reply_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum replies
CREATE TABLE public.forum_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID REFERENCES public.forum_threads(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.forum_replies(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum reply likes
CREATE TABLE public.forum_reply_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reply_id UUID REFERENCES public.forum_replies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(reply_id, user_id)
);

-- Workshops
CREATE TABLE public.workshops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    instructor_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    cover_url TEXT,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    price DECIMAL(10,2) DEFAULT 0.00,
    status workshop_status DEFAULT 'upcoming',
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    location VARCHAR(255),
    is_online BOOLEAN DEFAULT TRUE,
    meeting_url TEXT,
    materials JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workshop registrations
CREATE TABLE public.workshop_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
    payment_id UUID REFERENCES public.payments(id),
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workshop_id, user_id)
);

-- Workshop submissions
CREATE TABLE public.workshop_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(500),
    content TEXT,
    file_url TEXT,
    feedback TEXT,
    grade INTEGER CHECK (grade >= 0 AND grade <= 100),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- Art gallery
CREATE TABLE public.artworks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    tags JSONB DEFAULT '[]',
    like_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artwork likes
CREATE TABLE public.artwork_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artwork_id UUID REFERENCES public.artworks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(artwork_id, user_id)
);

-- News articles
CREATE TABLE public.news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    cover_url TEXT,
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    category VARCHAR(100) DEFAULT 'general',
    type VARCHAR(20) DEFAULT 'main' CHECK (type IN ('main', 'community')),
    is_published BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATIONS SYSTEM
-- =====================================================

-- Notifications
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ACHIEVEMENTS AND GAMIFICATION
-- =====================================================

-- Achievement definitions
CREATE TABLE public.achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    badge_url TEXT,
    points INTEGER DEFAULT 0,
    category VARCHAR(100),
    criteria JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements
CREATE TABLE public.user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- =====================================================
-- HALL OF QUILLS SYSTEM
-- =====================================================

-- Legendary characters
CREATE TABLE public.legendary_characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    photo_url TEXT,
    bio TEXT,
    achievements TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Best writers (Hall of Quills)
CREATE TABLE public.best_writers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    description TEXT,
    profile_link TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active writers
CREATE TABLE public.active_writers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    description TEXT,
    activity_score INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competition winners
CREATE TABLE public.competition_winners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    competition_name VARCHAR(255) NOT NULL,
    position INTEGER NOT NULL,
    prize TEXT,
    story_id UUID REFERENCES public.stories(id),
    awarded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Honorable mentions
CREATE TABLE public.honorable_mentions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    reason TEXT,
    story_id UUID REFERENCES public.stories(id),
    mentioned_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ADMIN AND MODERATION SYSTEM
-- =====================================================

-- Reports
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content_type content_type NOT NULL,
    content_id UUID NOT NULL,
    reason VARCHAR(255) NOT NULL,
    description TEXT,
    status report_status DEFAULT 'pending',
    reviewed_by UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content flags (automated or manual)
CREATE TABLE public.content_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type content_type NOT NULL,
    content_id UUID NOT NULL,
    flag_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    auto_flagged BOOLEAN DEFAULT FALSE,
    flagged_by UUID REFERENCES public.users(id),
    resolved_by UUID REFERENCES public.users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin actions log
CREATE TABLE public.admin_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL,
    target_type VARCHAR(100),
    target_id UUID,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System analytics
CREATE TABLE public.analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    dimensions JSONB DEFAULT '{}',
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SYSTEM CONFIGURATION
-- =====================================================

-- System settings
CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    data_type VARCHAR(50) DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- File uploads
CREATE TABLE public.file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    upload_context VARCHAR(100),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    website TEXT,
    subscription_end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User indexes
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_status ON public.users(status);
CREATE INDEX idx_users_is_premium ON public.users(is_premium);
CREATE INDEX idx_users_created_at ON public.users(created_at);

-- Story indexes
CREATE INDEX idx_stories_author_id ON public.stories(author_id);
CREATE INDEX idx_stories_status ON public.stories(status);
CREATE INDEX idx_stories_is_featured ON public.stories(is_featured);
CREATE INDEX idx_stories_is_premium ON public.stories(is_premium);
CREATE INDEX idx_stories_published_at ON public.stories(published_at);
CREATE INDEX idx_stories_created_at ON public.stories(created_at);
CREATE INDEX idx_stories_view_count ON public.stories(view_count);
CREATE INDEX idx_stories_like_count ON public.stories(like_count);
CREATE INDEX idx_stories_average_rating ON public.stories(average_rating);

-- Chapter indexes
CREATE INDEX idx_chapters_story_id ON public.chapters(story_id);
CREATE INDEX idx_chapters_chapter_number ON public.chapters(chapter_number);
CREATE INDEX idx_chapters_is_published ON public.chapters(is_published);

-- Comment indexes
CREATE INDEX idx_comments_story_id ON public.comments(story_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at);

-- Rating indexes
CREATE INDEX idx_ratings_story_id ON public.ratings(story_id);
CREATE INDEX idx_ratings_user_id ON public.ratings(user_id);
CREATE INDEX idx_ratings_rating ON public.ratings(rating);

-- Bookmark indexes
CREATE INDEX idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX idx_bookmarks_story_id ON public.bookmarks(story_id);

-- Follow indexes
CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX idx_follows_following_id ON public.follows(following_id);

-- Subscription indexes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_expires_at ON public.subscriptions(expires_at);

-- Club indexes
CREATE INDEX idx_clubs_creator_id ON public.clubs(creator_id);
CREATE INDEX idx_clubs_privacy ON public.clubs(privacy);
CREATE INDEX idx_clubs_is_featured ON public.clubs(is_featured);

-- Forum indexes
CREATE INDEX idx_forum_threads_forum_id ON public.forum_threads(forum_id);
CREATE INDEX idx_forum_threads_author_id ON public.forum_threads(author_id);
CREATE INDEX idx_forum_threads_created_at ON public.forum_threads(created_at);
CREATE INDEX idx_forum_threads_last_reply_at ON public.forum_threads(last_reply_at);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- Report indexes
CREATE INDEX idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX idx_reports_reported_user_id ON public.reports(reported_user_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_content_type ON public.reports(content_type);

-- =====================================================
-- ROLES AND PERMISSIONS
-- =====================================================

-- Create custom roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anonymous') THEN
        CREATE ROLE anonymous;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vip') THEN
        CREATE ROLE vip;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin') THEN
        CREATE ROLE admin;
    END IF;
END
$$;

-- Grant role hierarchy
GRANT anonymous TO authenticated;
GRANT authenticated TO vip;
GRANT vip TO admin;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view public profile info" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Stories policies
CREATE POLICY "Anyone can view published stories" ON public.stories
    FOR SELECT USING (status = 'published' OR auth.uid() = author_id);

CREATE POLICY "VIP users can view premium stories" ON public.stories
    FOR SELECT USING (
        status = 'published' AND 
        (NOT is_premium OR 
         auth.jwt() ->> 'role' IN ('vip', 'admin') OR 
         EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_premium = true))
    );

CREATE POLICY "Authors can manage own stories" ON public.stories
    FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Admins can manage all stories" ON public.stories
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Chapters policies
CREATE POLICY "Anyone can view published chapters" ON public.chapters
    FOR SELECT USING (
        is_published = true OR 
        EXISTS (SELECT 1 FROM public.stories WHERE id = story_id AND author_id = auth.uid())
    );

CREATE POLICY "Authors can manage own chapters" ON public.chapters
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.stories WHERE id = story_id AND author_id = auth.uid())
    );

-- Comments policies
CREATE POLICY "Anyone can view comments" ON public.comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON public.comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.comments
    FOR DELETE USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

-- Ratings policies
CREATE POLICY "Anyone can view ratings" ON public.ratings
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create ratings" ON public.ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings" ON public.ratings
    FOR UPDATE USING (auth.uid() = user_id);

-- Bookmarks policies
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks
    FOR ALL USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions" ON public.subscriptions
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Clubs policies
CREATE POLICY "Anyone can view public clubs" ON public.clubs
    FOR SELECT USING (privacy = 'public' OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Members can view private clubs" ON public.clubs
    FOR SELECT USING (
        privacy = 'public' OR 
        EXISTS (SELECT 1 FROM public.club_memberships WHERE club_id = id AND user_id = auth.uid())
    );

CREATE POLICY "Authenticated users can create clubs" ON public.clubs
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Club creators can manage their clubs" ON public.clubs
    FOR ALL USING (auth.uid() = creator_id OR auth.jwt() ->> 'role' = 'admin');

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Reports policies
CREATE POLICY "Users can create reports" ON public.reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can manage all reports" ON public.reports
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- News policies
CREATE POLICY "Anyone can view published news" ON public.news
    FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage all news" ON public.news
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- TRIGGER FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id)
    VALUES (NEW.id);
    
    INSERT INTO public.user_stats (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update story statistics
CREATE OR REPLACE FUNCTION update_story_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'ratings' THEN
        UPDATE public.stories SET
            average_rating = (SELECT AVG(rating) FROM public.ratings WHERE story_id = NEW.story_id),
            rating_count = (SELECT COUNT(*) FROM public.ratings WHERE story_id = NEW.story_id)
        WHERE id = NEW.story_id;
    ELSIF TG_TABLE_NAME = 'bookmarks' THEN
        UPDATE public.stories SET
            bookmark_count = (SELECT COUNT(*) FROM public.bookmarks WHERE story_id = NEW.story_id)
        WHERE id = NEW.story_id;
    ELSIF TG_TABLE_NAME = 'story_likes' THEN
        UPDATE public.stories SET
            like_count = (SELECT COUNT(*) FROM public.story_likes WHERE story_id = NEW.story_id)
        WHERE id = NEW.story_id;
    ELSIF TG_TABLE_NAME = 'comments' THEN
        UPDATE public.stories SET
            comment_count = (SELECT COUNT(*) FROM public.comments WHERE story_id = NEW.story_id)
        WHERE id = NEW.story_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update user statistics
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'stories' AND NEW.status = 'published' THEN
        UPDATE public.user_stats SET
            stories_published = (SELECT COUNT(*) FROM public.stories WHERE author_id = NEW.author_id AND status = 'published'),
            words_written = (SELECT COALESCE(SUM(word_count), 0) FROM public.stories WHERE author_id = NEW.author_id AND status = 'published')
        WHERE user_id = NEW.author_id;
    ELSIF TG_TABLE_NAME = 'follows' THEN
        -- Update follower count
        UPDATE public.user_stats SET
            followers_count = (SELECT COUNT(*) FROM public.follows WHERE following_id = NEW.following_id)
        WHERE user_id = NEW.following_id;
        
        -- Update following count
        UPDATE public.user_stats SET
            following_count = (SELECT COUNT(*) FROM public.follows WHERE follower_id = NEW.follower_id)
        WHERE user_id = NEW.follower_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to send notifications
CREATE OR REPLACE FUNCTION create_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'story_likes' THEN
        INSERT INTO public.notifications (user_id, type, title, message, data)
        SELECT 
            s.author_id,
            'story_like',
            'Story Liked',
            u.username || ' liked your story "' || s.title || '"',
            json_build_object('story_id', NEW.story_id, 'liker_id', NEW.user_id)
        FROM public.stories s, public.users u
        WHERE s.id = NEW.story_id AND u.id = NEW.user_id AND s.author_id != NEW.user_id;
    ELSIF TG_TABLE_NAME = 'comments' THEN
        INSERT INTO public.notifications (user_id, type, title, message, data)
        SELECT 
            s.author_id,
            'story_comment',
            'New Comment',
            u.username || ' commented on your story "' || s.title || '"',
            json_build_object('story_id', NEW.story_id, 'comment_id', NEW.id, 'commenter_id', NEW.user_id)
        FROM public.stories s, public.users u
        WHERE s.id = NEW.story_id AND u.id = NEW.user_id AND s.author_id != NEW.user_id;
    ELSIF TG_TABLE_NAME = 'follows' THEN
        INSERT INTO public.notifications (user_id, type, title, message, data)
        SELECT 
            NEW.following_id,
            'follow',
            'New Follower',
            u.username || ' started following you',
            json_build_object('follower_id', NEW.follower_id)
        FROM public.users u
        WHERE u.id = NEW.follower_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON public.stories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON public.chapters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON public.clubs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Profile creation trigger
CREATE TRIGGER create_profile_on_signup AFTER INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Statistics update triggers
CREATE TRIGGER update_story_rating_stats AFTER INSERT OR UPDATE OR DELETE ON public.ratings FOR EACH ROW EXECUTE FUNCTION update_story_stats();
CREATE TRIGGER update_story_bookmark_stats AFTER INSERT OR DELETE ON public.bookmarks FOR EACH ROW EXECUTE FUNCTION update_story_stats();
CREATE TRIGGER update_story_like_stats AFTER INSERT OR DELETE ON public.story_likes FOR EACH ROW EXECUTE FUNCTION update_story_stats();
CREATE TRIGGER update_story_comment_stats AFTER INSERT OR DELETE ON public.comments FOR EACH ROW EXECUTE FUNCTION update_story_stats();
CREATE TRIGGER update_user_story_stats AFTER INSERT OR UPDATE ON public.stories FOR EACH ROW EXECUTE FUNCTION update_user_stats();
CREATE TRIGGER update_user_follow_stats AFTER INSERT OR DELETE ON public.follows FOR EACH ROW EXECUTE FUNCTION update_user_stats();

-- Notification triggers
CREATE TRIGGER create_like_notification AFTER INSERT ON public.story_likes FOR EACH ROW EXECUTE FUNCTION create_notification();
CREATE TRIGGER create_comment_notification AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION create_notification();
CREATE TRIGGER create_follow_notification AFTER INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION create_notification();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default genres
INSERT INTO public.genres (name, description, color, icon) VALUES
('Fantasy', 'Magical and mythical stories', '#8B5CF6', 'sparkles'),
('Romance', 'Love and relationship stories', '#EC4899', 'heart'),
('Mystery', 'Suspenseful and intriguing tales', '#6B7280', 'search'),
('Adventure', 'Action-packed journeys', '#F59E0B', 'map'),
('Drama', 'Emotional and character-driven stories', '#EF4444', 'theater'),
('Comedy', 'Humorous and light-hearted tales', '#10B981', 'smile'),
('Horror', 'Scary and thrilling stories', '#1F2937', 'ghost'),
('Sci-Fi', 'Science fiction and futuristic tales', '#3B82F6', 'rocket');

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price, duration_months, features) VALUES
('Basic', 'Access to premium stories', 9.99, 1, '["Premium Stories", "Ad-free Reading"]'),
('Premium', 'Full access with exclusive content', 19.99, 3, '["Premium Stories", "Ad-free Reading", "Exclusive Content", "Early Access"]'),
('VIP', 'Ultimate storytelling experience', 49.99, 12, '["Premium Stories", "Ad-free Reading", "Exclusive Content", "Early Access", "Direct Author Contact", "Custom Themes"]');

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, points, category, criteria) VALUES
('First Story', 'Published your first story', 'book-open', 100, 'writing', '{"stories_published": 1}'),
('Prolific Writer', 'Published 10 stories', 'feather', 500, 'writing', '{"stories_published": 10}'),
('Popular Author', 'Received 100 likes across all stories', 'heart', 300, 'engagement', '{"total_likes": 100}'),
('Bookworm', 'Bookmarked 50 stories', 'bookmark', 200, 'reading', '{"bookmarks_created": 50}'),
('Community Member', 'Joined 5 clubs', 'users', 150, 'community', '{"clubs_joined": 5}'),
('Reviewer', 'Left 25 story reviews', 'star', 250, 'engagement', '{"reviews_written": 25}');

-- Insert system settings
INSERT INTO public.system_settings (key, value, description, is_public) VALUES
('site_name', 'NovelNexus', 'The name of the platform', true),
('site_description', 'A platform for creative storytelling', 'Site description for SEO', true),
('max_file_size', '10485760', 'Maximum file upload size in bytes (10MB)', false),
('stories_per_page', '20', 'Number of stories to show per page', true),
('enable_registrations', 'true', 'Whether new user registrations are allowed', false);

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================

-- Grant appropriate permissions
GRANT USAGE ON SCHEMA public TO anonymous, authenticated, vip, admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO admin;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anonymous;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, admin;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;

COMMIT;
