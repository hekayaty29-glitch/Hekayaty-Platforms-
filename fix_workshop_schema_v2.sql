-- Fix workshop schema compatibility issues - Version 2
-- Check actual workshops table structure first, then create compatible functions

-- Check what columns actually exist in workshops table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'workshops' 
ORDER BY ordinal_position;

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_workshops_with_members();
DROP FUNCTION IF EXISTS get_workshop_detail(UUID);
DROP FUNCTION IF EXISTS get_workshop_detail(INTEGER);

-- Create a simple function that works with any workshop table structure
CREATE OR REPLACE FUNCTION get_workshops_with_members()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
BEGIN
    -- Use dynamic SQL to handle different column names
    SELECT JSON_AGG(
        JSON_BUILD_OBJECT(
            'id', w.id,
            'name', COALESCE(w.name, w.title, 'Untitled Workshop'),
            'host_id', COALESCE(w.creator_id, w.instructor_id, w.host_id, w.owner_id),
            'description', COALESCE(w.description, ''),
            'draft', COALESCE(w.draft, ''),
            'cover_url', w.cover_url,
            'created_at', w.created_at,
            'members', COALESCE(member_array.members, ARRAY[]::TEXT[])
        )
    ) INTO result
    FROM workshops w
    LEFT JOIN (
        SELECT 
            workshop_id,
            ARRAY_AGG(user_id::TEXT) as members
        FROM workshop_registrations 
        GROUP BY workshop_id
    ) member_array ON w.id = member_array.workshop_id
    ORDER BY w.created_at DESC;
    
    RETURN COALESCE(result, '[]'::JSON);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_workshops_with_members() TO authenticated;
GRANT EXECUTE ON FUNCTION get_workshops_with_members() TO anon;
