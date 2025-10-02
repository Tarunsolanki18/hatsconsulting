-- Update database to properly handle proof files
-- Run this in Supabase SQL Editor

-- Step 1: Add new columns for better proof handling (if not exist)
DO $$
BEGIN
    -- Add proof_file_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' AND column_name = 'proof_file_name') THEN
        ALTER TABLE reports ADD COLUMN proof_file_name TEXT;
    END IF;
    
    -- Add proof_file_type column if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' AND column_name = 'proof_file_type') THEN
        ALTER TABLE reports ADD COLUMN proof_file_type TEXT;
    END IF;
    
    -- Add proof_file_size column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' AND column_name = 'proof_file_size') THEN
        ALTER TABLE reports ADD COLUMN proof_file_size INTEGER;
    END IF;
    
    -- Add proof_base64 column for actual file data if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' AND column_name = 'proof_base64') THEN
        ALTER TABLE reports ADD COLUMN proof_base64 TEXT;
    END IF;
END $$;

-- Step 2: Create function to extract proof data from notes
CREATE OR REPLACE FUNCTION extract_proof_from_notes()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    report_record RECORD;
    proof_data TEXT;
    proof_type TEXT;
BEGIN
    -- Loop through all reports that have proof data in notes
    FOR report_record IN 
        SELECT id, notes 
        FROM reports 
        WHERE notes IS NOT NULL 
        AND (notes LIKE '%data:image/%' OR notes LIKE '%data:application/pdf%')
        AND proof_base64 IS NULL
    LOOP
        -- Extract base64 proof data from notes
        proof_data := NULL;
        proof_type := NULL;
        
        -- Check for image proof
        IF report_record.notes LIKE '%data:image/%' THEN
            proof_data := substring(report_record.notes FROM 'data:image/[^;]+;base64,([A-Za-z0-9+/=]+)');
            proof_type := substring(report_record.notes FROM 'data:(image/[^;]+)');
        -- Check for PDF proof
        ELSIF report_record.notes LIKE '%data:application/pdf%' THEN
            proof_data := substring(report_record.notes FROM 'data:application/pdf;base64,([A-Za-z0-9+/=]+)');
            proof_type := 'application/pdf';
        END IF;
        
        -- Update record if proof data found
        IF proof_data IS NOT NULL THEN
            UPDATE reports 
            SET 
                proof_base64 = 'data:' || proof_type || ';base64,' || proof_data,
                proof_file_type = proof_type,
                proof_file_name = CASE 
                    WHEN proof_type LIKE 'image/%' THEN 'proof_image.' || split_part(proof_type, '/', 2)
                    WHEN proof_type = 'application/pdf' THEN 'proof_document.pdf'
                    ELSE 'proof_file'
                END
            WHERE id = report_record.id;
            
            RAISE NOTICE 'Updated report % with proof type %', report_record.id, proof_type;
        END IF;
    END LOOP;
END $$;

-- Step 3: Run the extraction function
SELECT extract_proof_from_notes();

-- Step 4: Clean up notes by removing base64 data (optional)
UPDATE reports 
SET notes = TRIM(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(notes, 
                'Payment Proof: data:image/[^;]+;base64,[A-Za-z0-9+/=]+', 
                'Payment Proof: [Image attached]', 'g'),
            'Trade Proof: data:image/[^;]+;base64,[A-Za-z0-9+/=]+', 
            'Trade Proof: [Image attached]', 'g'),
        'data:application/pdf;base64,[A-Za-z0-9+/=]+', 
        '[PDF attached]', 'g')
)
WHERE notes IS NOT NULL 
AND (notes LIKE '%data:image/%' OR notes LIKE '%data:application/pdf%');

-- Step 5: Show updated reports summary
SELECT 
    id,
    report_type,
    application_name,
    customer_name,
    CASE 
        WHEN proof_base64 IS NOT NULL THEN '✅ Has Proof'
        ELSE '❌ No Proof'
    END as proof_status,
    proof_file_type,
    proof_file_name,
    CASE 
        WHEN LENGTH(proof_base64) > 100 THEN '📁 ' || ROUND(LENGTH(proof_base64)/1024.0, 1) || ' KB'
        ELSE '📄 Small file'
    END as file_size_info,
    created_at
FROM reports 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_proof_type ON reports(proof_file_type);
CREATE INDEX IF NOT EXISTS idx_reports_has_proof ON reports(id) WHERE proof_base64 IS NOT NULL;