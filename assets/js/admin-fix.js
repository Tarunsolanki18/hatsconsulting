// Admin Panel Fix Script
// This script addresses common issues with the admin panel

(function() {
    'use strict';
    
    console.log('🔧 Admin Fix Script Loading...');
    
    // Wait for DOM and all scripts to load
    function waitForDependencies() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 10 seconds max wait
            
            function checkDependencies() {
                attempts++;
                
                if (window.App && window.App.supabase && window.APP_CONFIG) {
                    console.log('✅ All dependencies loaded successfully');
                    resolve();
                    return;
                }
                
                if (attempts >= maxAttempts) {
                    console.error('❌ Dependencies failed to load after', maxAttempts * 200, 'ms');
                    reject(new Error('Dependencies failed to load'));
                    return;
                }
                
                console.log(`⏳ Waiting for dependencies... (${attempts}/${maxAttempts})`);
                setTimeout(checkDependencies, 200);
            }
            
            checkDependencies();
        });
    }
    
    // Enhanced error handling for report loading
    async function loadReportsWithRetry(maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Loading reports (attempt ${attempt}/${maxRetries})`);
                
                // Check database connection
                const { data: testData, error: testError } = await window.App.supabase
                    .from('reports')
                    .select('count')
                    .limit(1);
                
                if (testError) {
                    throw new Error(`Database connection failed: ${testError.message}`);
                }
                
                // Load reports with proper error handling
                const { data: reports, error } = await window.App.supabase
                    .from('reports')
                    .select(`
                        *,
                        profiles:user_id (
                            id,
                            full_name,
                            email
                        )
                    `)
                    .order('created_at', { ascending: false });
                
                if (error) {
                    throw error;
                }
                
                console.log(`✅ Successfully loaded ${reports?.length || 0} reports`);
                return reports || [];
                
            } catch (error) {
                console.error(`❌ Attempt ${attempt} failed:`, error);
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }
    
    // Fix common admin panel issues
    function fixAdminPanelIssues() {
        console.log('🔧 Applying admin panel fixes...');
        
        // Fix 1: Ensure proper error display
        if (!document.getElementById('error-display')) {
            const errorDiv = document.createElement('div');
            errorDiv.id = 'error-display';
            errorDiv.className = 'fixed top-4 left-4 right-4 z-50 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg hidden';
            errorDiv.innerHTML = '<span id="error-message"></span><button onclick="this.parentElement.classList.add(\'hidden\')" class="float-right text-red-500 hover:text-red-700">&times;</button>';
            document.body.appendChild(errorDiv);
        }
        
        // Fix 2: Add loading indicator
        if (!document.getElementById('loading-indicator')) {
            const loadingDiv = document.createElement('div');
            loadingDiv.id = 'loading-indicator';
            loadingDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
            loadingDiv.innerHTML = '<div class="bg-white p-6 rounded-lg"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div><p class="mt-2 text-center">Loading...</p></div>';
            document.body.appendChild(loadingDiv);
        }
        
        // Fix 3: Override window.loadReportsTable if it exists
        if (window.loadReportsTable) {
            const originalLoadReports = window.loadReportsTable;
            window.loadReportsTable = async function() {
                try {
                    showLoading(true);
                    await waitForDependencies();
                    const reports = await loadReportsWithRetry();
                    
                    // Call original function with loaded data
                    if (typeof originalLoadReports === 'function') {
                        return await originalLoadReports.call(this, reports);
                    }
                    
                } catch (error) {
                    showError(`Failed to load reports: ${error.message}`);
                    console.error('❌ Report loading failed:', error);
                } finally {
                    showLoading(false);
                }
            };
        }
        
        console.log('✅ Admin panel fixes applied');
    }
    
    // Utility functions
    function showError(message) {
        const errorDisplay = document.getElementById('error-display');
        const errorMessage = document.getElementById('error-message');
        if (errorDisplay && errorMessage) {
            errorMessage.textContent = message;
            errorDisplay.classList.remove('hidden');
            
            // Auto-hide after 10 seconds
            setTimeout(() => {
                errorDisplay.classList.add('hidden');
            }, 10000);
        } else {
            alert(`Error: ${message}`);
        }
    }
    
    function showLoading(show) {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            if (show) {
                loadingIndicator.classList.remove('hidden');
            } else {
                loadingIndicator.classList.add('hidden');
            }
        }
    }
    
    // Enhanced console logging for debugging
    function enhanceConsoleLogging() {
        const originalLog = console.log;
        const originalError = console.error;
        
        console.log = function(...args) {
            originalLog.apply(console, ['[ADMIN]', ...args]);
        };
        
        console.error = function(...args) {
            originalError.apply(console, ['[ADMIN ERROR]', ...args]);
            
            // Also show errors in UI if they're critical
            const errorMessage = args.join(' ');
            if (errorMessage.includes('reports') || errorMessage.includes('database') || errorMessage.includes('login')) {
                showError(errorMessage);
            }
        };
    }
    
    // Initialize fixes when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(() => {
                enhanceConsoleLogging();
                fixAdminPanelIssues();
            }, 500);
        });
    } else {
        setTimeout(() => {
            enhanceConsoleLogging();
            fixAdminPanelIssues();
        }, 500);
    }
    
    // Export functions for manual use
    window.AdminFix = {
        loadReportsWithRetry,
        showError,
        showLoading,
        waitForDependencies,
        fixAdminPanelIssues
    };
    
    console.log('✅ Admin Fix Script Loaded');
})();
