// Console Error Monitor - Helps track and fix JavaScript errors
(function() {
    'use strict';
    
    console.log('🔍 Console Monitor Initialized');
    
    // Store original console methods
    const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info
    };
    
    // Error tracking
    let errorCount = 0;
    let errors = [];
    
    // Enhanced console.error with UI feedback
    console.error = function(...args) {
        errorCount++;
        const errorMsg = args.join(' ');
        
        // Store error for debugging
        errors.push({
            timestamp: new Date().toISOString(),
            message: errorMsg,
            stack: new Error().stack
        });
        
        // Call original console.error
        originalConsole.error.apply(console, ['❌ ERROR #' + errorCount, ...args]);
        
        // Show critical errors in UI
        if (errorMsg.includes('Loading reports') || 
            errorMsg.includes('database') || 
            errorMsg.includes('login') ||
            errorMsg.includes('supabase')) {
            
            showErrorNotification(errorMsg);
        }
    };
    
    // Enhanced console.log with better formatting
    console.log = function(...args) {
        const timestamp = new Date().toLocaleTimeString();
        originalConsole.log.apply(console, [`[${timestamp}]`, ...args]);
    };
    
    // Function to show error notifications in UI
    function showErrorNotification(message) {
        // Create or update error notification
        let errorDiv = document.getElementById('console-error-notification');
        
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'console-error-notification';
            errorDiv.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: #fee2e2;
                border: 2px solid #fca5a5;
                color: #991b1b;
                padding: 12px 16px;
                border-radius: 8px;
                max-width: 400px;
                z-index: 10000;
                font-family: monospace;
                font-size: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            `;
            document.body.appendChild(errorDiv);
        }
        
        errorDiv.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px;">🚨 Console Error Detected</div>
            <div style="margin-bottom: 8px;">${message.substring(0, 200)}${message.length > 200 ? '...' : ''}</div>
            <button onclick="this.parentElement.remove()" style="background: #dc2626; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">Close</button>
            <button onclick="window.ConsoleMonitor.showErrorDetails()" style="background: #2563eb; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; margin-left: 4px;">Details</button>
        `;
        
        // Auto-hide after 15 seconds
        setTimeout(() => {
            if (errorDiv && errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 15000);
    }
    
    // Global error handler
    window.addEventListener('error', function(event) {
        console.error('Global JavaScript Error:', event.error?.message || event.message);
        console.error('File:', event.filename, 'Line:', event.lineno, 'Column:', event.colno);
        
        if (event.error?.stack) {
            console.error('Stack trace:', event.error.stack);
        }
    });
    
    // Promise rejection handler
    window.addEventListener('unhandledrejection', function(event) {
        console.error('Unhandled Promise Rejection:', event.reason);
        
        if (event.reason?.stack) {
            console.error('Stack trace:', event.reason.stack);
        }
    });
    
    // Monitor for specific admin panel issues
    function monitorAdminPanelIssues() {
        // Check for report loading issues
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            try {
                const response = await originalFetch.apply(this, args);
                
                if (!response.ok) {
                    console.error(`Fetch failed: ${response.status} ${response.statusText} for ${args[0]}`);
                }
                
                return response;
            } catch (error) {
                console.error('Fetch error:', error.message, 'for', args[0]);
                throw error;
            }
        };
        
        // Monitor Supabase operations
        if (window.App?.supabase) {
            const originalFrom = window.App.supabase.from;
            window.App.supabase.from = function(table) {
                console.log(`📊 Database query to table: ${table}`);
                return originalFrom.call(this, table);
            };
        }
    }
    
    // Utility functions
    function showErrorDetails() {
        const errorDetails = errors.slice(-10).map((err, index) => 
            `${index + 1}. [${err.timestamp}] ${err.message}`
        ).join('\n\n');
        
        const detailsWindow = window.open('', '_blank', 'width=800,height=600');
        detailsWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Console Error Details</title>
                <style>
                    body { font-family: monospace; padding: 20px; background: #f9fafb; }
                    .error-item { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #ef4444; }
                    .timestamp { color: #6b7280; font-size: 12px; }
                    .message { margin: 8px 0; color: #1f2937; }
                    .stats { background: #dbeafe; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <h1>🔍 Console Error Monitor Report</h1>
                <div class="stats">
                    <strong>Total Errors:</strong> ${errorCount}<br>
                    <strong>Recent Errors:</strong> ${errors.length}<br>
                    <strong>Generated:</strong> ${new Date().toLocaleString()}
                </div>
                <h2>Recent Errors (Last 10):</h2>
                ${errors.slice(-10).map(err => `
                    <div class="error-item">
                        <div class="timestamp">${err.timestamp}</div>
                        <div class="message">${err.message}</div>
                    </div>
                `).join('')}
            </body>
            </html>
        `);
    }
    
    function clearErrors() {
        errors = [];
        errorCount = 0;
        console.log('✅ Error log cleared');
    }
    
    function getErrorSummary() {
        return {
            totalErrors: errorCount,
            recentErrors: errors.slice(-5),
            errorTypes: [...new Set(errors.map(e => e.message.split(':')[0]))]
        };
    }
    
    // Initialize monitoring after DOM loads
    document.addEventListener('DOMContentLoaded', function() {
        monitorAdminPanelIssues();
        console.log('✅ Console monitoring active');
    });
    
    // Export functions for manual use
    window.ConsoleMonitor = {
        showErrorDetails,
        clearErrors,
        getErrorSummary,
        errors: () => errors,
        errorCount: () => errorCount
    };
    
    // Show monitoring status
    setTimeout(() => {
        console.log('🔍 Console Monitor Status:', {
            errorsDetected: errorCount,
            monitoringActive: true,
            commands: 'Use ConsoleMonitor.showErrorDetails() for details'
        });
    }, 2000);
    
})();
