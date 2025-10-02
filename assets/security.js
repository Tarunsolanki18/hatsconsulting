/**
 * Security Module for Admin Panel
 * Provides XSS protection, input validation, rate limiting, and CSRF protection
 */

// Initialize security module
const Security = {
    // Rate limiting configuration
    rateLimiting: {
        maxRequests: 50,
        timeWindow: 60000, // 1 minute
        requestCount: 0,
        windowStart: Date.now(),
        enabled: true
    },

    // Initialize security features
    init: function() {
        this.setupCSRFProtection();
        this.setupXSSProtection();
        this.setupInputValidation();
        this.setupRateLimiting();
        console.log('Security module initialized');
    },

    // CSRF Protection
    setupCSRFProtection: function() {
        // Generate CSRF token if not exists
        if (!localStorage.getItem('csrf_token')) {
            const token = this.generateRandomToken(32);
            localStorage.setItem('csrf_token', token);
        }

        // Add CSRF token to all fetch/XHR requests
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
            if (!options.headers) {
                options.headers = {};
            }
            
            // Add CSRF token to headers
            options.headers['X-CSRF-Token'] = localStorage.getItem('csrf_token');
            
            return originalFetch.call(this, url, options);
        };

        // Add CSRF token to Supabase requests if Supabase is available
        if (typeof supabase !== 'undefined') {
            const token = localStorage.getItem('csrf_token');
            supabase.headers = { ...supabase.headers, 'X-CSRF-Token': token };
        }
    },

    // XSS Protection
    setupXSSProtection: function() {
        // Sanitize HTML content
        window.sanitizeHTML = function(html) {
            const temp = document.createElement('div');
            temp.textContent = html;
            return temp.innerHTML;
        };

        // Sanitize URL
        window.sanitizeURL = function(url) {
            try {
                const parsedURL = new URL(url);
                // Only allow http and https protocols
                if (parsedURL.protocol !== 'http:' && parsedURL.protocol !== 'https:') {
                    return '';
                }
                return url;
            } catch (e) {
                return '';
            }
        };
    },

    // Input Validation
    setupInputValidation: function() {
        // Email validation
        window.validateEmail = function(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        };

        // Text input validation (prevent script injection)
        window.validateTextInput = function(text) {
            // Remove potentially dangerous content
            return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                       .replace(/on\w+="[^"]*"/gi, '')
                       .replace(/javascript:/gi, '');
        };

        // Number validation
        window.validateNumber = function(num) {
            return !isNaN(parseFloat(num)) && isFinite(num);
        };

        // Date validation
        window.validateDate = function(date) {
            return !isNaN(Date.parse(date));
        };
    },

    // Rate Limiting
    setupRateLimiting: function() {
        // Check rate limit before making API calls
        window.checkRateLimit = function() {
            const now = Date.now();
            const security = Security.rateLimiting;
            
            // Reset counter if time window has passed
            if (now - security.windowStart > security.timeWindow) {
                security.requestCount = 0;
                security.windowStart = now;
                return true;
            }
            
            // Check if rate limit exceeded
            if (security.requestCount >= security.maxRequests) {
                console.error('Rate limit exceeded. Please try again later.');
                alert('Too many requests. Please try again in a minute.');
                return false;
            }
            
            // Increment request counter
            security.requestCount++;
            return true;
        };

        // Apply rate limiting to fetch
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
            if (Security.rateLimiting.enabled && !checkRateLimit()) {
                return Promise.reject(new Error('Rate limit exceeded'));
            }
            return originalFetch.call(this, url, options);
        };
    },

    // Helper function to generate random token
    generateRandomToken: function(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    // Content Security Policy setup - DISABLED FOR TESTING
    setupCSP: function() {
        // CSP temporarily disabled to fix connection issues
        console.log('CSP setup disabled for testing');
        return;
        
        // Create CSP meta tag
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = "default-src 'self'; script-src 'self' https://cdn.tailwindcss.com https://unpkg.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net 'unsafe-inline' 'unsafe-eval'; style-src 'self' https://cdnjs.cloudflare.com 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://bvjcbejqvfcguqaxityd.supabase.co; font-src 'self' https://cdnjs.cloudflare.com;";
        document.head.appendChild(meta);
    },

    // Session timeout
    setupSessionTimeout: function(timeoutMinutes = 30) {
        let lastActivity = Date.now();
        const timeoutMs = timeoutMinutes * 60 * 1000;

        // Update last activity time on user interaction
        const resetTimer = () => {
            lastActivity = Date.now();
        };

        // Check for session timeout
        const checkTimeout = () => {
            if (Date.now() - lastActivity > timeoutMs) {
                // Session expired, log out
                if (typeof logout === 'function') {
                    alert('Your session has expired due to inactivity. Please log in again.');
                    logout();
                } else {
                    alert('Your session has expired. Please refresh the page and log in again.');
                    window.location.href = 'login.html';
                }
            }
        };

        // Add event listeners for user activity
        ['click', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });

        // Check for timeout every minute
        setInterval(checkTimeout, 60000);
    }
};

// Initialize security features when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    Security.init();
    Security.setupCSP();
    Security.setupSessionTimeout(30); // 30 minutes timeout
});

// Export Security module
window.Security = Security;