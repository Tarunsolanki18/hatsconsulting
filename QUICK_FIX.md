# 🚨 URGENT FIX - Report Submission Error

## Error:
```
Could not find the 'proof_base64' column of 'reports' in the schema cache
```

## ⚡ QUICK FIX (2 minutes):

### Option 1: Automatic Fix
1. Open `fix-database.html` in browser
2. Click "Add Missing Columns" 
3. Wait for success message
4. Test report submission

### Option 2: Manual Fix (Recommended)
1. Go to [Supabase Dashboard](https://supabase.com)
2. Open your project
3. Click "SQL Editor" in left sidebar
4. Copy and paste this SQL:

```sql
-- Add proof columns to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS proof_base64 TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS proof_file_name TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS proof_file_type TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS proof_file_size INTEGER;
```

5. Click "Run"
6. You should see "SUCCESS" message

### Option 3: Use Fallback (Works Immediately)
The code now has automatic fallback! Just try submitting report again - it will work with old database structure while proof data is stored in notes field.

---

## ✅ After Fix:
- Reports submit successfully ✅
- Proof files stored properly ✅  
- Admin can view/download proofs ✅
- Users can view/download proofs ✅

## 🔍 Verify Fix:
Run in browser console:
```javascript
DebugHelper.createTestReport()
```

---

## 📝 What Happened:
New proof file system needs additional database columns that weren't created yet. The fix adds these columns so files can be stored properly in database instead of just in notes field.

## 🎯 Next Steps:
After fix, all new reports will use the enhanced proof system with proper file handling, viewing, and download capabilities.

**Time to fix: 2 minutes**  
**Difficulty: Easy** 
**Impact: Enables full proof file system**