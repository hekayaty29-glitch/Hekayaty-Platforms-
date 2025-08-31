-- Database schema additions for NovelNexus complete wiring
-- Run these SQL commands in your Supabase SQL editor

-- TaleCraft Projects table
CREATE TABLE IF NOT EXISTS talecraft_projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('story', 'comic', 'photo')),
    content JSONB DEFAULT '{}',
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chapters JSONB DEFAULT '[]',
    pages JSONB DEFAULT '[]',
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Purchases table
CREATE TABLE IF NOT EXISTS user_purchases (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('story', 'novel')),
    amount DECIMAL(10,2) NOT NULL,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tales of Prophets content tables
CREATE TABLE IF NOT EXISTS tales_prophets (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    img TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tales_companions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    img TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_talecraft_projects_author_id ON talecraft_projects(author_id);
CREATE INDEX IF NOT EXISTS idx_talecraft_projects_type ON talecraft_projects(type);
CREATE INDEX IF NOT EXISTS idx_user_purchases_user_id ON user_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_item_type ON user_purchases(item_type);

-- Row Level Security (RLS) policies
ALTER TABLE talecraft_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE tales_prophets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tales_companions ENABLE ROW LEVEL SECURITY;

-- TaleCraft projects policies
CREATE POLICY "Users can view their own projects" ON talecraft_projects
    FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Users can insert their own projects" ON talecraft_projects
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own projects" ON talecraft_projects
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own projects" ON talecraft_projects
    FOR DELETE USING (auth.uid() = author_id);

-- User purchases policies
CREATE POLICY "Users can view their own purchases" ON user_purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases" ON user_purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tales content policies (public read)
CREATE POLICY "Anyone can view tales content" ON tales_prophets
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view tales content" ON tales_companions
    FOR SELECT USING (true);

-- Admin policies for tales content
CREATE POLICY "Admins can manage tales content" ON tales_prophets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.is_admin = true OR profiles.role = 'admin')
        )
    );

CREATE POLICY "Admins can manage tales content" ON tales_companions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.is_admin = true OR profiles.role = 'admin')
        )
    );
