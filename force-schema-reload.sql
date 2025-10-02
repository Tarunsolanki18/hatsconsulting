-- FORCE SCHEMA CACHE RELOAD
-- Run this in Supabase SQL Editor to immediately fix the column error

-- Method 1: Direct PostgreSQL notification
SELECT pg_notify('pgrst', 'reload schema');

-- Method 2: If you have the reload_schema function, call it
-- (Uncomment if this function exists in your database)
-- SELECT public.reload_schema();

-- Method 3: Check if columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'campaigns' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Method 4: If columns don't exist, add them now
DO $$ 
BEGIN
    -- Add campaign_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' 
        AND column_name = 'campaign_type'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.campaigns ADD COLUMN campaign_type TEXT;
        RAISE NOTICE 'Added campaign_type column';
    ELSE
        RAISE NOTICE 'campaign_type column already exists';
    END IF;

    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' 
        AND column_name = 'is_active'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.campaigns ADD COLUMN is_active BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_active column';
    ELSE
        RAISE NOTICE 'is_active column already exists';
    END IF;

    -- Add other columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' 
        AND column_name = 'reward_amount'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.campaigns ADD COLUMN reward_amount NUMERIC DEFAULT 0;
        RAISE NOTICE 'Added reward_amount column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' 
        AND column_name = 'description'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.campaigns ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' 
        AND column_name = 'account_open_link'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.campaigns ADD COLUMN account_open_link TEXT;
        RAISE NOTICE 'Added account_open_link column';
    END IF;
END $$;

-- Final schema reload
SELECT pg_notify('pgrst', 'reload schema');