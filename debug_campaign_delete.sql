-- Debug Campaign Deletion Issues
-- Run this in your Supabase SQL Editor

-- 1. Check current campaigns table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'campaigns'
ORDER BY ordinal_position;

-- 2. Check if 'created_by' column exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'campaigns' 
    AND column_name = 'created_by'
) as created_by_column_exists;

-- 3. Check current RLS policies on campaigns table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'campaigns';

-- 4. Check if there are any foreign key constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (tc.table_name = 'campaigns' OR ccu.table_name = 'campaigns');

-- 5. Check current campaigns data
SELECT id, name, created_by, created_at, is_active
FROM campaigns
LIMIT 5;

-- 6. Fix: Add created_by column if it doesn't exist
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 7. Update existing campaigns to have created_by if null
UPDATE campaigns 
SET created_by = (
    SELECT id 
    FROM auth.users 
    ORDER BY created_at ASC 
    LIMIT 1
)
WHERE created_by IS NULL;

-- 8. Fix RLS policies for campaigns table
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON campaigns;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON campaigns;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON campaigns;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON campaigns;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON campaigns;

-- Create comprehensive RLS policies
CREATE POLICY "Enable all operations for authenticated users" ON campaigns
    FOR ALL USING (auth.role() = 'authenticated');

-- Alternative: More specific policies if the above doesn't work
CREATE POLICY "Enable select for authenticated users" ON campaigns
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON campaigns
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON campaigns
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON campaigns
    FOR DELETE USING (auth.role() = 'authenticated');

-- 9. Ensure RLS is enabled
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- 10. Test query - this should work now
-- DELETE FROM campaigns WHERE created_by = '17d121c7-c1d0-4f62-9dcf-ec136aff6b61';