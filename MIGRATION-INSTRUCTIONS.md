# Fix Campaign Creation Error - Database Migration

## Problem
Your admin panel is getting this error when adding campaigns:
```
Could not find the 'campaign_type' column of 'campaigns' in the schema cache
```

This happens because your database table is missing several columns that the admin panel expects.

## Solution

### Step 1: Apply Database Migration

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration**
   - Copy ALL the content from `database-migration.sql` 
   - Paste it into the SQL Editor
   - Click "Run" button

### Step 2: Verify the Migration

After running the migration, your campaigns table should have these columns:
- `id` (existing)
- `name` (existing)
- `account_open_link` ✅ NEW
- `trade_video_link` ✅ NEW  
- `reward_amount` ✅ NEW
- `description` ✅ NEW
- `campaign_type` ✅ NEW
- `is_active` ✅ NEW
- `image_url` ✅ NEW
- `notes` ✅ NEW
- Plus any other existing columns

### Step 3: Test Campaign Creation

1. Go to your admin panel
2. Try adding a new campaign
3. The error should be resolved!

## What the Migration Does

1. **Adds Missing Columns**: All the fields your admin panel tries to use
2. **Sets Default Values**: Prevents null value issues
3. **Adds Database Constraints**: Ensures data integrity
4. **Creates Indexes**: Improves query performance  
5. **Reloads Schema Cache**: Forces Supabase to recognize changes

## Troubleshooting

### If you still get errors after migration:

1. **Clear your browser cache** and refresh the admin page
2. **Check the browser console** for any new error messages
3. **Verify the migration ran successfully** by checking if new columns exist

### To check if columns exist, run this query in SQL Editor:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'campaigns' 
ORDER BY ordinal_position;
```

## Files Updated
- ✅ `database-migration.sql` - Database schema updates
- ✅ `admin.html` - Fixed JavaScript field mapping
- ✅ Admin panel now uses correct column names

## Need Help?
If you encounter any issues, check:
1. Supabase project logs
2. Browser developer console for errors
3. Ensure you're running the migration as a database admin