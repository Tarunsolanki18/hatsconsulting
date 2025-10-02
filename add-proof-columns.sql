-- Add proof columns to reports table
-- Run this in Supabase SQL Editor FIRST

-- Add new columns for proof file handling
ALTER TABLE reports ADD COLUMN IF NOT EXISTS proof_base64 TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS proof_file_name TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS proof_file_type TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS proof_file_size INTEGER;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reports' 
AND column_name LIKE 'proof_%';

-- Show current table structure
\d reports;