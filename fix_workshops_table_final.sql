-- Check if workshops table exists and what columns it has
DO $$
BEGIN
    -- First, let's see what columns exist in the workshops table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workshops') THEN
        RAISE NOTICE 'Workshops table exists. Checking columns...';
        
        -- Add creator_id column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workshops' AND column_name = 'creator_id') THEN
            ALTER TABLE public.workshops ADD COLUMN creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added creator_id column to workshops table';
        ELSE
            RAISE NOTICE 'creator_id column already exists';
        END IF;
        
        -- Add other required columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workshops' AND column_name = 'name') THEN
            ALTER TABLE public.workshops ADD COLUMN name TEXT NOT NULL;
            RAISE NOTICE 'Added name column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workshops' AND column_name = 'description') THEN
            ALTER TABLE public.workshops ADD COLUMN description TEXT;
            RAISE NOTICE 'Added description column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workshops' AND column_name = 'is_active') THEN
            ALTER TABLE public.workshops ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
            RAISE NOTICE 'Added is_active column';
        END IF;
        
    ELSE
        -- Create the workshops table from scratch
        RAISE NOTICE 'Creating workshops table...';
        CREATE TABLE public.workshops (
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
        
        -- Create policies
        CREATE POLICY "Users can create workshops" ON public.workshops FOR INSERT WITH CHECK (auth.uid() = creator_id);
        CREATE POLICY "Users can view workshops" ON public.workshops FOR SELECT USING (TRUE);
        CREATE POLICY "Users can update their own workshops" ON public.workshops FOR UPDATE USING (auth.uid() = creator_id);
        
        RAISE NOTICE 'Workshops table created successfully';
    END IF;
END $$;
