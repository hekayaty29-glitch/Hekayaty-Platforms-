-- =====================================================
-- CLUB AND WORKSHOP RPC FUNCTIONS FOR SUPABASE
-- =====================================================

-- Function to get clubs with member counts
CREATE OR REPLACE FUNCTION get_clubs_with_members()
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  description TEXT,
  logo_url TEXT,
  founder_id UUID,
  created_at TIMESTAMPTZ,
  members TEXT[]
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.cover_url as logo_url,
    c.creator_id as founder_id,
    c.created_at,
    COALESCE(
      ARRAY_AGG(cm.user_id::TEXT) FILTER (WHERE cm.user_id IS NOT NULL),
      ARRAY[]::TEXT[]
    ) as members
  FROM clubs c
  LEFT JOIN club_memberships cm ON c.id = cm.club_id
  GROUP BY c.id, c.name, c.description, c.cover_url, c.creator_id, c.created_at
  ORDER BY c.created_at DESC;
END;
$$;

-- Function to get club detail with messages
CREATE OR REPLACE FUNCTION get_club_detail(p_club_id UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  description TEXT,
  logo_url TEXT,
  founder_id UUID,
  created_at TIMESTAMPTZ,
  members TEXT[],
  messages JSON
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.cover_url as logo_url,
    c.creator_id as founder_id,
    c.created_at,
    COALESCE(
      ARRAY_AGG(DISTINCT cm.user_id::TEXT) FILTER (WHERE cm.user_id IS NOT NULL),
      ARRAY[]::TEXT[]
    ) as members,
    COALESCE(
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', msg.id,
          'club_id', msg.club_id,
          'user_id', msg.user_id,
          'text', msg.text,
          'created_at', msg.created_at
        ) ORDER BY msg.created_at DESC
      ) FILTER (WHERE msg.id IS NOT NULL),
      '[]'::JSON
    ) as messages
  FROM clubs c
  LEFT JOIN club_memberships cm ON c.id = cm.club_id
  LEFT JOIN club_messages msg ON c.id = msg.club_id
  WHERE c.id = p_club_id
  GROUP BY c.id, c.name, c.description, c.cover_url, c.creator_id, c.created_at;
END;
$$;

-- Function to get workshops with member counts
CREATE OR REPLACE FUNCTION get_workshops_with_members()
RETURNS TABLE (
  id UUID,
  name VARCHAR,
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

-- Function to get workshop detail with messages
CREATE OR REPLACE FUNCTION get_workshop_detail(p_workshop_id UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
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

-- Create missing tables if they don't exist
CREATE TABLE IF NOT EXISTS club_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workshop_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add draft column to workshops if it doesn't exist
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS draft TEXT;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_clubs_with_members() TO authenticated;
GRANT EXECUTE ON FUNCTION get_club_detail(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_workshops_with_members() TO authenticated;
GRANT EXECUTE ON FUNCTION get_workshop_detail(UUID) TO authenticated;

-- Enable RLS on new tables
ALTER TABLE club_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for club_messages
CREATE POLICY "Users can view club messages if they are members" ON club_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.club_memberships cm 
      WHERE cm.club_id = club_messages.club_id 
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert club messages if they are members" ON club_messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.club_memberships cm 
      WHERE cm.club_id = club_messages.club_id 
      AND cm.user_id = auth.uid()
    )
  );

-- RLS policies for workshop_messages
CREATE POLICY "Users can view workshop messages if they are registered" ON workshop_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workshop_registrations wr 
      WHERE wr.workshop_id = workshop_messages.workshop_id 
      AND wr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert workshop messages if they are registered" ON workshop_messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.workshop_registrations wr 
      WHERE wr.workshop_id = workshop_messages.workshop_id 
      AND wr.user_id = auth.uid()
    )
  );
