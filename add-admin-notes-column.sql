-- Add admin_notes column to reports table if it doesn't exist
-- Run this SQL in your Supabase SQL Editor

-- Check if admin_notes column exists and add it if missing
DO $$
BEGIN
    -- Check if the column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'reports' 
        AND column_name = 'admin_notes'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE reports ADD COLUMN admin_notes TEXT;
        
        -- Add a comment to the column
        COMMENT ON COLUMN reports.admin_notes IS 'Admin notes/messages visible to users';
        
        RAISE NOTICE 'admin_notes column added successfully to reports table';
    ELSE
        RAISE NOTICE 'admin_notes column already exists in reports table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'reports' 
AND column_name = 'admin_notes';

-- Test query to ensure the column works
SELECT id, admin_notes FROM reports LIMIT 1;
