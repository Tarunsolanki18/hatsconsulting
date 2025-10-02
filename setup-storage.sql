-- SUPABASE STORAGE SETUP for Photo Uploads
-- Run this in Supabase SQL Editor to create storage bucket and policies

-- 1. Create the 'proofs' storage bucket (if it doesn't exist)
-- Note: Buckets are usually created via Supabase Dashboard > Storage, but this is the SQL way
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'proofs',
    'proofs',
    true,
    52428800, -- 50MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- 2. Create storage policies for user uploads

-- Allow users to upload their own files
CREATE POLICY "Users can upload their own files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'proofs' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow users to view their own files
CREATE POLICY "Users can view their own files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'proofs' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow admins to view all files
CREATE POLICY "Admins can view all files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'proofs' AND
        EXISTS (SELECT 1 FROM public.admin_emails WHERE email = auth.email())
    );

-- Allow users to update their own files
CREATE POLICY "Users can update their own files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'proofs' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow users to delete their own files  
CREATE POLICY "Users can delete their own files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'proofs' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- 3. Enable RLS on storage.objects (should already be enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. Create alternative 'avatars' bucket for profile photos (optional)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars', 
    true,
    5242880, -- 5MB limit for avatars
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Avatar policies
CREATE POLICY "Users can upload their own avatars" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatars" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own avatars" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Show created buckets
SELECT id, name, public, file_size_limit, allowed_mime_types, created_at 
FROM storage.buckets 
WHERE id IN ('proofs', 'avatars');