-- Add subscription_end_date column for VIB system
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'subscription_end_date' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_end_date TIMESTAMPTZ;
        RAISE NOTICE 'Added subscription_end_date column to profiles table';
    ELSE
        RAISE NOTICE 'subscription_end_date column already exists in profiles table';
    END IF;
END $$;
