-- Fix RLS (Row Level Security) policies for reports table
-- Run this in Supabase SQL Editor if reports are not showing in admin panel

-- Option 1: Temporarily disable RLS for reports table (QUICK FIX)
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;

-- Option 2: Create proper admin access policy (RECOMMENDED)
-- Uncomment these lines if you want proper RLS instead of disabling it

/*
-- Enable RLS if not already enabled
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "admin_all_access" ON reports;
DROP POLICY IF EXISTS "users_own_reports" ON reports;

-- Create admin access policy (admin can see all reports)
CREATE POLICY "admin_all_access" ON reports
    FOR ALL 
    TO authenticated
    USING (
        auth.jwt() ->> 'email' IN (
            'hatsconsulting1@gmail.com'
        )
    );

-- Create user access policy (users can only see their own reports)  
CREATE POLICY "users_own_reports" ON reports
    FOR ALL 
    TO authenticated
    USING (auth.uid() = user_id);
*/

-- Check current RLS status
SELECT 
    schemaname,
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'reports';

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'reports';