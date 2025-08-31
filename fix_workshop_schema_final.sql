-- Fix workshop schema based on actual table structure
-- From inspection: workshops table has id (uuid), title, description, instructor_id, creator_id, name, etc.

-- Drop existing functions
DROP FUNCTION IF EXISTS get_workshops_with_members();
DROP FUNCTION IF EXISTS get_workshop_detail(UUID);
DROP FUNCTION IF EXISTS get_workshop_detail(INTEGER);

-- Create function matching actual table structure
CREATE OR REPLACE FUNCTION get_workshops_with_members()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT JSON_AGG(
        JSON_BUILD_OBJECT(
            'id', w.id::TEXT,  -- Convert UUID to text for frontend
            'name', COALESCE(w.name, w.title, 'Untitled Workshop'),
            'host_id', COALESCE(w.creator_id, w.instructor_id)::TEXT,
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

-- Create workshop detail function for UUID IDs
CREATE OR REPLACE FUNCTION get_workshop_detail(p_workshop_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT JSON_BUILD_OBJECT(
        'id', w.id::TEXT,
        'name', COALESCE(w.name, w.title, 'Untitled Workshop'),
        'host_id', COALESCE(w.creator_id, w.instructor_id)::TEXT,
        'description', COALESCE(w.description, ''),
        'draft', COALESCE(w.draft, ''),
        'cover_url', w.cover_url,
        'created_at', w.created_at,
        'members', COALESCE(member_array.members, ARRAY[]::TEXT[]),
        'messages', COALESCE(msg_array.messages, '[]'::JSON)
    ) INTO result
    FROM workshops w
    LEFT JOIN (
        SELECT 
            workshop_id,
            ARRAY_AGG(user_id::TEXT) as members
        FROM workshop_registrations 
        WHERE workshop_id = p_workshop_id
        GROUP BY workshop_id
    ) member_array ON w.id = member_array.workshop_id
    LEFT JOIN (
        SELECT 
            workshop_id,
            JSON_AGG(
                JSON_BUILD_OBJECT(
                    'id', id::TEXT,
                    'workshop_id', workshop_id::TEXT,
                    'user_id', user_id::TEXT,
                    'text', text,
                    'image_url', image_url,
                    'created_at', created_at
                ) ORDER BY created_at DESC
            ) as messages
        FROM workshop_messages 
        WHERE workshop_id = p_workshop_id
        GROUP BY workshop_id
    ) msg_array ON w.id = msg_array.workshop_id
    WHERE w.id = p_workshop_id;
    
    RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_workshops_with_members() TO authenticated;
GRANT EXECUTE ON FUNCTION get_workshops_with_members() TO anon;
GRANT EXECUTE ON FUNCTION get_workshop_detail(UUID) TO authenticated;
