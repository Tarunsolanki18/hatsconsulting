# 🔧 Testing Guide - Report Submission System

## Quick Start Testing

### Step 1: Database Connection Test
1. Open `database-test.html` in your browser
2. Click "Test Connection" - Should show ✅ 
3. Click "Test Tables" - Check if all tables are accessible
4. If tables show ❌, click "Create Tables" or use manual SQL

### Step 2: User Authentication Test
1. Login to your application (login.html)
2. Open browser console (F12)
3. Run: `DebugHelper.testLogin()`
4. Should show your email and user ID

### Step 3: Report Submission Test
1. Go to submit-report.html
2. Open browser console (F12)
3. Run: `DebugHelper.quickReportTest()`
4. Try submitting a test report through the form

### Step 4: Admin Panel Test
1. Login as admin (HATSCONSULTING1@GMAIL.COM)
2. Go to admin.html
3. Click "Check & Approve Reports"
4. Should see all submitted reports

---

## Detailed Troubleshooting

### Problem: "No reports showing in admin panel"

**Solution Steps:**
1. **Check Database Connection**
   ```javascript
   // In browser console
   DebugHelper.testDatabase()
   ```

2. **Check Reports Table**
   ```javascript
   // In browser console
   DebugHelper.testReportsTable()
   ```

3. **Check if Reports Exist**
   ```javascript
   // In browser console
   DebugHelper.checkAllReports()
   ```

4. **Create Test Report**
   ```javascript
   // In browser console (must be logged in)
   DebugHelper.createTestReport()
   ```

### Problem: "Reports not saving when submitted"

**Check These:**
1. **User is logged in**
   ```javascript
   DebugHelper.testLogin()
   ```

2. **Form validation**
   - Application Name filled?
   - Customer Name filled?
   - Mobile Number filled?

3. **Console errors**
   - Open F12 → Console tab
   - Look for red error messages
   - Check network tab for failed requests

### Problem: "Database tables not found"

**Manual Table Creation:**
1. Go to [Supabase Dashboard](https://supabase.com)
2. Open SQL Editor
3. Run this SQL:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    full_name TEXT,
    status TEXT DEFAULT 'active',
    role TEXT DEFAULT 'user',
    last_sign_in_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    report_type TEXT NOT NULL,
    application_name TEXT,
    customer_name TEXT,
    mobile_number TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'Pending',
    payment_proof_url TEXT,
    trade_proof_url TEXT,
    proof_url TEXT,
    admin_notes TEXT,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT,
    status TEXT DEFAULT 'active',
    is_active BOOLEAN DEFAULT true,
    account_open_link TEXT,
    trade_video_link TEXT,
    referral_link TEXT,
    image_url TEXT,
    payout_with_trade DECIMAL DEFAULT 0,
    payout_without_trade DECIMAL DEFAULT 0,
    description TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create earnings table
CREATE TABLE IF NOT EXISTS earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    today_earnings DECIMAL DEFAULT 0,
    week_earnings DECIMAL DEFAULT 0,
    month_earnings DECIMAL DEFAULT 0,
    all_time_earnings DECIMAL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);
```

---

## Common Issues & Solutions

### Issue 1: "User authentication error"
**Solution:** 
- Refresh page and login again
- Check if `currentUser` variable is set
- Verify email in `ADMIN_EMAILS` config

### Issue 2: "Reports table not accessible"
**Solution:**
- Run table creation SQL (see above)
- Check Supabase project status
- Verify API keys in config.js

### Issue 3: "Network/Connection errors"
**Solution:**
- Check internet connection
- Verify Supabase URL and API key
- Check browser console for CORS errors

### Issue 4: "Proof upload failing"
**Solution:**
- File size should be < 10MB
- Supported formats: JPG, PNG, PDF
- Check browser console for upload errors

---

## Testing Commands Reference

### Basic Tests
```javascript
// Check if everything is working
DebugHelper.runAllTests()

// Quick report test
DebugHelper.quickReportTest()

// Check what's in database
DebugHelper.checkAllReports()
```

### Individual Tests
```javascript
// Test user login
DebugHelper.testLogin()

// Test database connection
DebugHelper.testDatabase()

// Test reports table
DebugHelper.testReportsTable()

// Create test report
DebugHelper.createTestReport()
```

---

## Expected Workflow

1. **User Journey:**
   - User logs in → submit-report.html
   - Fills form → Submits report
   - Report saved to database with "pending" status
   - User can check status in check-reports.html

2. **Admin Journey:**
   - Admin logs in → admin.html  
   - Clicks "Check & Approve Reports"
   - Sees all submitted reports
   - Can approve/reject with notes

3. **Database Flow:**
   ```
   User Report → reports table → Admin Panel → Status Update
   ```

---

## Quick Fixes

### Reset Everything
```javascript
// Clear browser data
localStorage.clear()
sessionStorage.clear()

// Refresh page
window.location.reload()
```

### Force Database Sync
```javascript
// Re-create user profile
DebugHelper.testLogin()

// Check database
DebugHelper.runAllTests()
```

---

## Debug Mode

Add this to any page to enable detailed logging:
```javascript
// Enable debug mode
window.DEBUG_MODE = true;

// Check what's happening
console.log('Current user:', currentUser);
console.log('App config:', window.APP_CONFIG);
console.log('Supabase client:', App.supabase);
```

---

## Support Information

If issues persist:
1. Check browser console for errors
2. Verify Supabase project is active
3. Confirm all environment variables are set
4. Test with `database-test.html` first
5. Use `DebugHelper` commands for detailed testing

**Files involved:**
- `submit-report.html` - Report submission
- `admin.html` - Admin panel  
- `database-test.html` - Database testing
- `debug-script.js` - Debug helpers
- `assets/app.js` - Core functions
- `assets/config.js` - Configuration