// Debug script for testing database and user functionality
// Add this to any page to test functionality

window.DebugHelper = {
    
    // Test if user is logged in
    async testLogin() {
        console.log('🔍 Testing user login...');
        try {
            const session = await App.getSession();
            if (session && session.user) {
                console.log('✅ User is logged in:', session.user.email);
                console.log('👤 User ID:', session.user.id);
                return session.user;
            } else {
                console.log('❌ No user session found');
                return null;
            }
        } catch (error) {
            console.error('❌ Login test error:', error);
            return null;
        }
    },

    // Test database connection
    async testDatabase() {
        console.log('🔍 Testing database connection...');
        try {
            const { data, error } = await App.supabase.auth.getSession();
            if (error) {
                throw error;
            }
            console.log('✅ Database connection successful');
            return true;
        } catch (error) {
            console.error('❌ Database connection failed:', error);
            return false;
        }
    },

    // Test reports table
    async testReportsTable() {
        console.log('🔍 Testing reports table...');
        try {
            const { data, error } = await App.supabase
                .from('reports')
                .select('count', { count: 'exact', head: true });
            
            if (error) {
                throw error;
            }
            
            console.log('✅ Reports table accessible');
            return true;
        } catch (error) {
            console.error('❌ Reports table error:', error);
            return false;
        }
    },

    // Create test report
    async createTestReport() {
        console.log('🔍 Creating test report...');
        
        const user = await this.testLogin();
        if (!user) {
            console.log('❌ Cannot create report - user not logged in');
            return null;
        }

        try {
            const testReport = {
                user_id: user.id,
                report_type: 'trade',
                application_name: 'Debug Test Campaign',
                customer_name: 'Test Customer',
                mobile_number: '9999999999',
                notes: 'This is a debug test report created at ' + new Date().toLocaleString(),
                status: 'pending',
                payment_status: 'Pending',
                created_at: new Date().toISOString()
            };

            const { data, error } = await App.createReport(testReport);
            
            if (error) {
                throw error;
            }
            
            console.log('✅ Test report created successfully:', data);
            return data;
        } catch (error) {
            console.error('❌ Test report creation failed:', error);
            return null;
        }
    },

    // Check all reports in database
    async checkAllReports() {
        console.log('🔍 Checking all reports in database...');
        
        try {
            const { data: reports, error } = await App.supabase
                .from('reports')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                throw error;
            }
            
            console.log(`✅ Found ${reports.length} reports in database:`);
            
            if (reports.length > 0) {
                reports.forEach((report, index) => {
                    console.log(`📊 Report ${index + 1}:`, {
                        id: report.id,
                        type: report.report_type,
                        application: report.application_name,
                        customer: report.customer_name,
                        status: report.status,
                        created: new Date(report.created_at).toLocaleString()
                    });
                });
            } else {
                console.log('📝 No reports found in database');
            }
            
            return reports;
        } catch (error) {
            console.error('❌ Error checking reports:', error);
            return null;
        }
    },

    // Run all tests
    async runAllTests() {
        console.log('🚀 Running all debug tests...');
        console.log('================================');
        
        await this.testLogin();
        await this.testDatabase();
        await this.testReportsTable();
        await this.checkAllReports();
        
        console.log('================================');
        console.log('✅ All tests completed');
    },

    // Quick test for submit-report page
    async quickReportTest() {
        console.log('🚀 Quick Report Submission Test');
        console.log('================================');
        
        const user = await this.testLogin();
        if (!user) {
            console.log('❌ Please login first');
            return;
        }
        
        const dbOk = await this.testDatabase();
        const tableOk = await this.testReportsTable();
        
        if (dbOk && tableOk) {
            console.log('✅ Everything looks good - ready for report submission!');
            await this.createTestReport();
        } else {
            console.log('❌ Issues found - check database setup');
        }
        
        console.log('================================');
    }
};

// Auto-run basic tests when script loads
console.log('🔧 Debug Helper Loaded');
console.log('Available commands:');
console.log('- DebugHelper.testLogin()');
console.log('- DebugHelper.testDatabase()');
console.log('- DebugHelper.testReportsTable()'); 
console.log('- DebugHelper.createTestReport()');
console.log('- DebugHelper.checkAllReports()');
console.log('- DebugHelper.runAllTests()');
console.log('- DebugHelper.quickReportTest()');