-- COMPREHENSIVE MIGRATION to fix campaigns table schema
-- This adds ALL necessary columns for the admin panel to work properly

-- First, let's add all the missing columns that the admin panel expects
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS account_open_link TEXT;

ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS trade_video_link TEXT;

ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS reward_amount NUMERIC DEFAULT 0;

ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add campaign_type if it doesn't exist (this is causing the current error)
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS campaign_type TEXT;

-- Add is_active if it doesn't exist (used by campaign.html)
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- Add other potentially useful columns
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing columns to have proper constraints
-- Add constraint to campaign_type if it exists
DO $$ 
BEGIN
    -- Only add constraint if column exists and doesn't have constraint
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'campaigns' AND column_name = 'campaign_type') THEN
        
        -- First set default values for any null campaign_type records
        UPDATE public.campaigns 
        SET campaign_type = 'account_open' 
        WHERE campaign_type IS NULL;
        
        -- Try to add constraint, ignore if it already exists
        BEGIN
            ALTER TABLE public.campaigns 
            ADD CONSTRAINT campaigns_campaign_type_check 
            CHECK (campaign_type IN ('account_open', 'trade'));
        EXCEPTION WHEN duplicate_object THEN
            -- Constraint already exists, ignore
        END;
    END IF;
END $$;

-- Set default values for important columns to prevent null issues
UPDATE public.campaigns 
SET 
    is_active = COALESCE(is_active, false),
    reward_amount = COALESCE(reward_amount, 0),
    campaign_type = COALESCE(campaign_type, 'account_open')
WHERE 
    is_active IS NULL 
    OR reward_amount IS NULL 
    OR campaign_type IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_is_active ON public.campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_campaigns_campaign_type ON public.campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_account_open_link ON public.campaigns(account_open_link);

-- Add helpful comments
COMMENT ON COLUMN public.campaigns.account_open_link IS 'URL for account opening process';
COMMENT ON COLUMN public.campaigns.trade_video_link IS 'URL for trade instruction video';
COMMENT ON COLUMN public.campaigns.reward_amount IS 'Base reward amount for this campaign';
COMMENT ON COLUMN public.campaigns.description IS 'Campaign description';
COMMENT ON COLUMN public.campaigns.campaign_type IS 'Campaign type: account_open or trade';
COMMENT ON COLUMN public.campaigns.is_active IS 'Whether the campaign is currently active';

-- Force PostgREST to reload schema cache
-- This is critical after schema changes!
SELECT pg_notify('pgrst', 'reload schema');

-- Show final table structure for verification
-- Uncomment the next line to see the table structure after migration
-- \d public.campaigns;
