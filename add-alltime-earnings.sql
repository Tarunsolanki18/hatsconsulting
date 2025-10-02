-- Add All Time Earnings Column to Database
-- Run this in Supabase SQL Editor

-- 1. Add all_time_earnings column to earnings table
ALTER TABLE public.earnings 
ADD COLUMN IF NOT EXISTS all_time_earnings INTEGER DEFAULT 0;

-- 2. Update existing records to have a reasonable all_time_earnings value
-- (Set it to the current total field as a starting point)
UPDATE public.earnings 
SET all_time_earnings = COALESCE(total, 0)
WHERE all_time_earnings = 0 OR all_time_earnings IS NULL;

-- 3. Add comment for documentation
COMMENT ON COLUMN public.earnings.all_time_earnings IS 'Total earnings accumulated since user registration';

-- 4. Update existing schema to use the new time-based earnings structure
-- Add new columns for better earnings tracking
ALTER TABLE public.earnings 
ADD COLUMN IF NOT EXISTS today_earnings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS week_earnings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS month_earnings INTEGER DEFAULT 0;

-- 5. Migrate old data to new structure (if needed)
-- Set reasonable defaults from existing data
UPDATE public.earnings 
SET 
    today_earnings = COALESCE(today, 0),
    week_earnings = COALESCE(week, 0),
    month_earnings = COALESCE(total, 0),
    all_time_earnings = COALESCE(total, 0)
WHERE today_earnings = 0 AND week_earnings = 0 AND month_earnings = 0;

-- 6. Create or replace function to calculate all-time earnings
CREATE OR REPLACE FUNCTION public.update_all_time_earnings(user_id_param UUID, amount_to_add INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update all_time_earnings by adding the specified amount
    UPDATE public.earnings 
    SET 
        all_time_earnings = COALESCE(all_time_earnings, 0) + amount_to_add,
        updated_at = now()
    WHERE user_id = user_id_param;
    
    -- If user doesn't have earnings record, create one
    IF NOT FOUND THEN
        INSERT INTO public.earnings (user_id, all_time_earnings, today_earnings, week_earnings, month_earnings, total, today, week, pending_adjustments)
        VALUES (user_id_param, amount_to_add, 0, 0, 0, 0, 0, 0, 0);
    END IF;
END;
$$;

-- 7. Add comments for the new columns
COMMENT ON COLUMN public.earnings.today_earnings IS 'Earnings for today';
COMMENT ON COLUMN public.earnings.week_earnings IS 'Earnings for current week';
COMMENT ON COLUMN public.earnings.month_earnings IS 'Earnings for current month';

-- 8. Show the updated table structure
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'earnings' AND table_schema = 'public'
ORDER BY ordinal_position;