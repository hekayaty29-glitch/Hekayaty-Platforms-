-- Debug Database - Check what exists and fix step by step
-- Run this first to see what's missing

-- 1. Check if stories table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stories' AND table_schema = 'public')
        THEN 'stories table EXISTS'
        ELSE 'stories table MISSING'
    END as stories_status;

-- 2. Check what columns exist in stories table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'stories' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if profiles table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public')
        THEN 'profiles table EXISTS'
        ELSE 'profiles table MISSING'
    END as profiles_status;

-- 4. Check what columns exist in profiles table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. List all tables in public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
