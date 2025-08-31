-- Fix workshop creation foreign key constraints
-- Try different possible column names for workshops table

-- Option 1: Try host_id (common workshop column name)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workshops' AND column_name = 'host_id') THEN
        ALTER TABLE public.workshops DROP CONSTRAINT IF EXISTS workshops_host_id_fkey;
        ALTER TABLE public.workshops 
        ADD CONSTRAINT workshops_host_id_fkey 
        FOREIGN KEY (host_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Fixed workshops.host_id constraint';
    END IF;
END $$;

-- Option 2: Try creator_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workshops' AND column_name = 'creator_id') THEN
        ALTER TABLE public.workshops DROP CONSTRAINT IF EXISTS workshops_creator_id_fkey;
        ALTER TABLE public.workshops 
        ADD CONSTRAINT workshops_creator_id_fkey 
        FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Fixed workshops.creator_id constraint';
    END IF;
END $$;

-- Option 3: Try owner_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workshops' AND column_name = 'owner_id') THEN
        ALTER TABLE public.workshops DROP CONSTRAINT IF EXISTS workshops_owner_id_fkey;
        ALTER TABLE public.workshops 
        ADD CONSTRAINT workshops_owner_id_fkey 
        FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Fixed workshops.owner_id constraint';
    END IF;
END $$;

-- Option 4: Try author_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workshops' AND column_name = 'author_id') THEN
        ALTER TABLE public.workshops DROP CONSTRAINT IF EXISTS workshops_author_id_fkey;
        ALTER TABLE public.workshops 
        ADD CONSTRAINT workshops_author_id_fkey 
        FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Fixed workshops.author_id constraint';
    END IF;
END $$;

-- Fix workshop participants/members table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workshop_participants') THEN
        ALTER TABLE public.workshop_participants DROP CONSTRAINT IF EXISTS workshop_participants_user_id_fkey;
        ALTER TABLE public.workshop_participants 
        ADD CONSTRAINT workshop_participants_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Fixed workshop_participants.user_id constraint';
    END IF;
END $$;

-- Alternative: workshop_members table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workshop_members') THEN
        ALTER TABLE public.workshop_members DROP CONSTRAINT IF EXISTS workshop_members_user_id_fkey;
        ALTER TABLE public.workshop_members 
        ADD CONSTRAINT workshop_members_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Fixed workshop_members.user_id constraint';
    END IF;
END $$;
