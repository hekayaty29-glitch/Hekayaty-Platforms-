-- Create workshops table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.workshops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;

-- Create policy for workshop creation and access
CREATE POLICY "Users can create workshops" ON public.workshops FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can view workshops" ON public.workshops FOR SELECT USING (TRUE);
CREATE POLICY "Users can update their own workshops" ON public.workshops FOR UPDATE USING (auth.uid() = creator_id);
