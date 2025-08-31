-- =====================================================
-- NOVELNEXUS COMPLETE BACKEND SCHEMA
-- Supabase + Cloudinary + Retool Integration
-- Generated: 2025-07-25
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CUSTOM TYPES AND ENUMS
-- =====================================================

-- User roles enum (updated for your requirements)
CREATE TYPE user_role AS ENUM ('free', 'vip', 'admin', 'superadmin');

-- User status enum
CREATE TYPE user_status AS ENUM ('active', 'banned', 'suspended', 'pending', 'deleted');

-- Story status enum
CREATE TYPE story_status AS ENUM ('draft', 'published', 'archived', 'deleted', 'premium');

-- Story type enum (for TaleCraft integration)
CREATE TYPE story_type AS ENUM ('web_story', 'pdf_story', 'comic');

-- Subscription status enum
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled', 'pending');

-- Payment status enum
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Payment method enum (your specified methods)
CREATE TYPE payment_method AS ENUM ('vodafone_cash', 'paypal', 'fawry', 'stripe');

-- Notification type enum
CREATE TYPE notification_type AS ENUM ('story_like', 'story_comment', 'follow', 'mention', 'system', 'achievement', 'subscription', 'workshop', 'club');

-- Report status enum
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');

-- Content type enum for reports
CREATE TYPE content_type AS ENUM ('story', 'comment', 'user', 'forum_post', 'artwork', 'comic');

-- Workshop status enum
CREATE TYPE workshop_status AS ENUM ('upcoming', 'ongoing', 'completed', 'cancelled');

-- Club privacy enum
CREATE TYPE club_privacy AS ENUM ('public', 'private', 'invite_only');

-- Code type enum (for subscription codes)
CREATE TYPE code_type AS ENUM ('free_2month', 'paid_1month', 'paid_3month', 'paid_6month', 'paid_12month', 'admin_custom');

-- Ad placement enum
CREATE TYPE ad_placement AS ENUM ('header', 'sidebar', 'between_stories', 'footer', 'popup');

-- =====================================================
-- CORE USER TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    bio TEXT,
    avatar_url TEXT, -- Cloudinary URL
    cover_url TEXT, -- Cloudinary URL
    role user_role DEFAULT 'free',
    status user_status DEFAULT 'active',
    is_premium BOOLEAN DEFAULT FALSE,
    is_author BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    premium_expires_at TIMESTAMPTZ,
    stories_downloaded_this_month INTEGER DEFAULT 0,
    download_reset_date DATE DEFAULT CURRENT_DATE,
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
    comics_published INTEGER DEFAULT 0,
    words_written INTEGER DEFAULT 0,
    bookmarks_received INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    total_likes_received INTEGER DEFAULT 0,
    total_comments_received INTEGER DEFAULT 0,
    reading_streak_days INTEGER DEFAULT 0,
    workshops_created INTEGER DEFAULT 0,
    workshops_attended INTEGER DEFAULT 0,
    clubs_created INTEGER DEFAULT 0,
    clubs_joined INTEGER DEFAULT 0,
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
    is_free_code BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription codes (your special system)
CREATE TABLE public.subscription_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    code_type code_type NOT NULL,
    duration_months INTEGER NOT NULL,
    description TEXT,
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.users(id),
    -- Special field for 2-month codes ending Sept 22
    force_expire_at TIMESTAMPTZ DEFAULT '2025-09-22 23:59:59+00',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Code redemptions
CREATE TABLE public.code_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code_id UUID REFERENCES public.subscription_codes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id),
    redeemed_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    UNIQUE(code_id, user_id)
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
-- CONTENT MANAGEMENT TABLES
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

-- Stories (includes comics and PDF stories)
CREATE TABLE public.stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    content TEXT, -- For web stories
    story_type story_type DEFAULT 'web_story',
    cover_url TEXT, -- Cloudinary URL
    poster_url TEXT, -- Cloudinary URL
    soundtrack_url TEXT, -- Cloudinary URL
    pdf_url TEXT, -- Cloudinary URL for PDF stories
    extra_photos JSONB DEFAULT '[]', -- Cloudinary URLs
    status story_status DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    is_early_access BOOLEAN DEFAULT FALSE, -- For VIP early access
    reading_time_minutes INTEGER DEFAULT 0,
    word_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    published_at TIMESTAMPTZ,
    early_access_until TIMESTAMPTZ, -- When early access ends
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

-- Comics (separate from stories for better organization)
CREATE TABLE public.comics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    cover_url TEXT, -- Cloudinary URL
    status story_status DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comic pages
CREATE TABLE public.comic_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comic_id UUID REFERENCES public.comics(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    image_url TEXT NOT NULL, -- Cloudinary URL
    alt_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comic_id, page_number)
);

-- Story downloads tracking
CREATE TABLE public.story_downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
    downloaded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, story_id)
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
-- COMMUNITY FEATURES TABLES
-- =====================================================

-- Clubs
CREATE TABLE public.clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover_url TEXT, -- Cloudinary URL
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
    cover_url TEXT, -- Cloudinary URL
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    price DECIMAL(10,2) DEFAULT 0.00,
    status workshop_status DEFAULT 'upcoming',
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    location VARCHAR(255),
    is_online BOOLEAN DEFAULT TRUE,
    meeting_url TEXT,
    materials JSONB DEFAULT '[]', -- Cloudinary URLs for materials
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
    file_url TEXT, -- Cloudinary URL
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
    image_url TEXT NOT NULL, -- Cloudinary URL
    thumbnail_url TEXT, -- Cloudinary URL
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
    cover_url TEXT, -- Cloudinary URL
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
    badge_url TEXT, -- Cloudinary URL
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
    photo_url TEXT, -- Cloudinary URL
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
    avatar_url TEXT, -- Cloudinary URL
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
    avatar_url TEXT, -- Cloudinary URL
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

-- Sponsored ads (your requirement)
CREATE TABLE public.sponsored_ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    image_url TEXT, -- Cloudinary URL
    click_url TEXT,
    placement ad_placement NOT NULL,
    target_audience JSONB DEFAULT '{}', -- targeting criteria
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    click_count INTEGER DEFAULT 0,
    impression_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
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

-- File uploads (Cloudinary integration)
CREATE TABLE public.file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    cloudinary_public_id VARCHAR(255) NOT NULL,
    cloudinary_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    upload_context VARCHAR(100),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- User indexes
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_status ON public.users(status);
CREATE INDEX idx_users_is_premium ON public.users(is_premium);
CREATE INDEX idx_users_premium_expires_at ON public.users(premium_expires_at);
CREATE INDEX idx_users_created_at ON public.users(created_at);

-- Story indexes
CREATE INDEX idx_stories_author_id ON public.stories(author_id);
CREATE INDEX idx_stories_status ON public.stories(status);
CREATE INDEX idx_stories_story_type ON public.stories(story_type);
CREATE INDEX idx_stories_is_featured ON public.stories(is_featured);
CREATE INDEX idx_stories_is_premium ON public.stories(is_premium);
CREATE INDEX idx_stories_is_early_access ON public.stories(is_early_access);
CREATE INDEX idx_stories_published_at ON public.stories(published_at);
CREATE INDEX idx_stories_created_at ON public.stories(created_at);
CREATE INDEX idx_stories_view_count ON public.stories(view_count);
CREATE INDEX idx_stories_average_rating ON public.stories(average_rating);

-- Subscription indexes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_expires_at ON public.subscriptions(expires_at);
CREATE INDEX idx_subscription_codes_code ON public.subscription_codes(code);
CREATE INDEX idx_subscription_codes_code_type ON public.subscription_codes(code_type);
CREATE INDEX idx_subscription_codes_valid_until ON public.subscription_codes(valid_until);

-- Community indexes
CREATE INDEX idx_clubs_creator_id ON public.clubs(creator_id);
CREATE INDEX idx_clubs_privacy ON public.clubs(privacy);
CREATE INDEX idx_workshops_instructor_id ON public.workshops(instructor_id);
CREATE INDEX idx_workshops_status ON public.workshops(status);
CREATE INDEX idx_workshops_starts_at ON public.workshops(starts_at);

-- Comment and interaction indexes
CREATE INDEX idx_comments_story_id ON public.comments(story_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_ratings_story_id ON public.ratings(story_id);
CREATE INDEX idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX idx_story_downloads_user_id ON public.story_downloads(user_id);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view public profiles" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

-- Stories policies (with your permission system)
CREATE POLICY "Anyone can view published stories" ON public.stories
    FOR SELECT USING (
        status = 'published' OR 
        auth.uid() = author_id OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

CREATE POLICY "VIP users can view premium and early access stories" ON public.stories
    FOR SELECT USING (
        status = 'published' AND 
        (NOT is_premium OR 
         EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND (role IN ('vip', 'admin', 'superadmin') OR is_premium = true))
        ) AND
        (NOT is_early_access OR 
         EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND (role IN ('vip', 'admin', 'superadmin') OR is_premium = true))
        )
    );

CREATE POLICY "Authors can manage own stories" ON public.stories
    FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Admins can manage all stories" ON public.stories
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

-- Download restrictions for free users
CREATE POLICY "Download limits for free users" ON public.story_downloads
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND (
            EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND (role IN ('vip', 'admin', 'superadmin') OR is_premium = true))
            OR
            (SELECT COUNT(*) FROM public.story_downloads WHERE user_id = auth.uid() AND downloaded_at >= date_trunc('month', CURRENT_DATE)) < 5
        )
    );

-- Subscription policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions" ON public.subscriptions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

-- Club policies (with your permission system)
CREATE POLICY "Users can view public clubs" ON public.clubs
    FOR SELECT USING (
        privacy = 'public' OR 
        auth.uid() = creator_id OR
        EXISTS (SELECT 1 FROM public.club_memberships WHERE club_id = id AND user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

CREATE POLICY "All users can create clubs" ON public.clubs
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators and admins can manage clubs" ON public.clubs
    FOR ALL USING (
        auth.uid() = creator_id OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

-- Workshop policies
CREATE POLICY "Users can view workshops" ON public.workshops
    FOR SELECT USING (true);

CREATE POLICY "All users can create workshops" ON public.workshops
    FOR INSERT WITH CHECK (auth.uid() = instructor_id);

CREATE POLICY "Instructors and admins can manage workshops" ON public.workshops
    FOR ALL USING (
        auth.uid() = instructor_id OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

-- Notification policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGER FUNCTIONS
-- =====================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create user profile and stats on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id) VALUES (NEW.id);
    INSERT INTO public.user_stats (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Reset monthly download counter
CREATE OR REPLACE FUNCTION reset_monthly_downloads()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.download_reset_date < CURRENT_DATE THEN
        NEW.stories_downloaded_this_month = 0;
        NEW.download_reset_date = CURRENT_DATE;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Handle subscription code redemption
CREATE OR REPLACE FUNCTION redeem_subscription_code()
RETURNS TRIGGER AS $$
DECLARE
    code_record RECORD;
    expire_date TIMESTAMPTZ;
BEGIN
    -- Get code details
    SELECT * INTO code_record FROM public.subscription_codes WHERE id = NEW.code_id;
    
    -- Calculate expiry date
    IF code_record.code_type = 'free_2month' THEN
        -- Special handling for 2-month codes ending Sept 22
        expire_date = LEAST(
            NOW() + INTERVAL '2 months',
            code_record.force_expire_at
        );
    ELSE
        expire_date = NOW() + (code_record.duration_months || ' months')::INTERVAL;
    END IF;
    
    NEW.expires_at = expire_date;
    
    -- Update user premium status
    UPDATE public.users SET 
        is_premium = true,
        role = CASE WHEN role = 'free' THEN 'vip' ELSE role END,
        premium_expires_at = expire_date
    WHERE id = NEW.user_id;
    
    -- Update code usage
    UPDATE public.subscription_codes SET 
        current_uses = current_uses + 1
    WHERE id = NEW.code_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Update story statistics
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
    ELSIF TG_TABLE_NAME = 'story_downloads' THEN
        UPDATE public.stories SET
            download_count = (SELECT COUNT(*) FROM public.story_downloads WHERE story_id = NEW.story_id)
        WHERE id = NEW.story_id;
        
        -- Update user's monthly download count
        UPDATE public.users SET
            stories_downloaded_this_month = stories_downloaded_this_month + 1
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON public.stories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON public.clubs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Profile creation trigger
CREATE TRIGGER create_profile_on_signup AFTER INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Download reset trigger
CREATE TRIGGER reset_downloads_before_update BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION reset_monthly_downloads();

-- Code redemption trigger
CREATE TRIGGER handle_code_redemption BEFORE INSERT ON public.code_redemptions FOR EACH ROW EXECUTE FUNCTION redeem_subscription_code();

-- Statistics triggers
CREATE TRIGGER update_story_rating_stats AFTER INSERT OR UPDATE OR DELETE ON public.ratings FOR EACH ROW EXECUTE FUNCTION update_story_stats();
CREATE TRIGGER update_story_bookmark_stats AFTER INSERT OR DELETE ON public.bookmarks FOR EACH ROW EXECUTE FUNCTION update_story_stats();
CREATE TRIGGER update_story_like_stats AFTER INSERT OR DELETE ON public.story_likes FOR EACH ROW EXECUTE FUNCTION update_story_stats();
CREATE TRIGGER update_story_download_stats AFTER INSERT ON public.story_downloads FOR EACH ROW EXECUTE FUNCTION update_story_stats();

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

-- Insert subscription plans
INSERT INTO public.subscription_plans (name, description, price, duration_months, features) VALUES
('1 Month VIP', 'One month premium access', 9.99, 1, '["No Ads", "Unlimited Downloads", "Premium Stories", "Early Access"]'),
('3 Month VIP', 'Three months premium access', 24.99, 3, '["No Ads", "Unlimited Downloads", "Premium Stories", "Early Access", "Exclusive Content"]'),
('6 Month VIP', 'Six months premium access', 44.99, 6, '["No Ads", "Unlimited Downloads", "Premium Stories", "Early Access", "Exclusive Content", "Priority Support"]'),
('12 Month VIP', 'One year premium access', 79.99, 12, '["No Ads", "Unlimited Downloads", "Premium Stories", "Early Access", "Exclusive Content", "Priority Support", "Special Badges"]');

-- Insert achievements
INSERT INTO public.achievements (name, description, icon, points, category, criteria) VALUES
('First Story', 'Published your first story', 'book-open', 100, 'writing', '{"stories_published": 1}'),
('Prolific Writer', 'Published 10 stories', 'feather', 500, 'writing', '{"stories_published": 10}'),
('Community Leader', 'Created your first club', 'users', 200, 'community', '{"clubs_created": 1}'),
('Workshop Master', 'Created 5 workshops', 'graduation-cap', 300, 'teaching', '{"workshops_created": 5}'),
('Popular Author', 'Received 100 likes', 'heart', 250, 'engagement', '{"total_likes": 100}'),
('Bookworm', 'Bookmarked 50 stories', 'bookmark', 150, 'reading', '{"bookmarks_created": 50}');

-- Insert system settings
INSERT INTO public.system_settings (key, value, description, is_public) VALUES
('site_name', 'NovelNexus', 'Platform name', true),
('free_download_limit', '5', 'Monthly download limit for free users', false),
('two_month_code_cutoff', '2025-09-22', 'Cutoff date for 2-month free codes', false),
('enable_early_access', 'true', 'Enable early access for VIP users', false);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;

COMMIT;
