-- Fix workshop schema compatibility issues
-- Update the database functions to work with the actual workshops table structure

-- First, update the get_workshops_with_members function
DROP FUNCTION IF EXISTS get_workshops_with_members();

CREATE OR REPLACE FUNCTION get_workshops_with_members()
RETURNS TABLE (
  id INTEGER,
  name TEXT,
  host_id UUID,
  description TEXT,
  draft TEXT,
  cover_url TEXT,
  created_at TIMESTAMPTZ,
  members TEXT[]
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    COALESCE(w.name, w.title) as name,
    COALESCE(w.creator_id, w.instructor_id, w.host_id) as host_id,
    w.description,
    w.draft,
    w.cover_url,
    w.created_at,
    COALESCE(
      ARRAY_AGG(wr.user_id::TEXT) FILTER (WHERE wr.user_id IS NOT NULL),
      ARRAY[]::TEXT[]
    ) as members
  FROM workshops w
  LEFT JOIN workshop_registrations wr ON w.id = wr.workshop_id
  GROUP BY w.id, w.name, w.title, w.creator_id, w.instructor_id, w.host_id, w.description, w.draft, w.cover_url, w.created_at
  ORDER BY w.created_at DESC;
END;
$$;

-- Update the get_workshop_detail function
DROP FUNCTION IF EXISTS get_workshop_detail(INTEGER);

CREATE OR REPLACE FUNCTION get_workshop_detail(p_workshop_id INTEGER)
RETURNS TABLE (
  id INTEGER,
  name TEXT,
  host_id UUID,
  description TEXT,
  draft TEXT,
  cover_url TEXT,
  created_at TIMESTAMPTZ,
  members TEXT[],
  messages JSON
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    COALESCE(w.name, w.title) as name,
    COALESCE(w.creator_id, w.instructor_id, w.host_id) as host_id,
    w.description,
    w.draft,
    w.cover_url,
    w.created_at,
    COALESCE(
      ARRAY_AGG(DISTINCT wr.user_id::TEXT) FILTER (WHERE wr.user_id IS NOT NULL),
      ARRAY[]::TEXT[]
    ) as members,
    COALESCE(
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', msg.id,
          'workshop_id', msg.workshop_id,
          'user_id', msg.user_id,
          'text', msg.text,
          'image_url', msg.image_url,
          'created_at', msg.created_at
        ) ORDER BY msg.created_at DESC
      ) FILTER (WHERE msg.id IS NOT NULL),
      '[]'::JSON
    ) as messages
  FROM workshops w
  LEFT JOIN workshop_registrations wr ON w.id = wr.workshop_id
  LEFT JOIN workshop_messages msg ON w.id = msg.workshop_id
  WHERE w.id = p_workshop_id
  GROUP BY w.id, w.name, w.title, w.creator_id, w.instructor_id, w.host_id, w.description, w.draft, w.cover_url, w.created_at;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_workshops_with_members() TO authenticated;
GRANT EXECUTE ON FUNCTION get_workshop_detail(INTEGER) TO authenticated;
