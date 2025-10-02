// Comprehensive authentication helper
window.AuthHelper = {
    // Initialize page with authentication check
    async initPage(requireAdmin = false) {
        try {
            // Prevent redirect loops
            if (window.location.pathname.includes('login.html')) {
                return null;
            }
            
            // Check if App is properly initialized
            if (!window.App || !window.App.getSession) {
                console.error('App not properly initialized');
                setTimeout(() => {
                    if (window.location.pathname !== '/login.html') {
                        window.location.href = 'login.html';
                    }
                }, 1000);
                return null;
            }
            
            const session = await window.App.getSession();
            if (!session || !session.user) {
                console.log('No session found, redirecting to login');
                if (window.location.pathname !== '/login.html') {
                    window.location.href = 'login.html';
                }
                return null;
            }

            // Check admin requirement
            if (requireAdmin && !window.App.isAdmin(session.user)) {
                console.log('User is not admin, redirecting to dashboard');
                if (window.location.pathname !== '/dashboard.html') {
                    window.location.href = 'dashboard.html';
                }
                return null;
            }

            // Check if user was marked as deleted and reactivate them (non-blocking)
            this.reactivateDeletedUser(session.user.id).catch(err => {
                console.log('Reactivation check failed (non-critical):', err);
            });
            
            return session.user;
        } catch (error) {
            console.error('Authentication error:', error);
            if (window.location.pathname !== '/login.html') {
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 500);
            }
            return null;
        }
    },
    
    // Reactivate user if they were marked as deleted
    async reactivateDeletedUser(userId) {
        try {
            // Skip if no userId or Supabase not available
            if (!userId || !window.App?.supabase) {
                return;
            }
            
            const { data: profile, error } = await window.App.supabase
                .from('profiles')
                .select('status')
                .eq('id', userId)
                .single();
                
            // Only proceed if we got valid data and user is marked as deleted
            if (!error && profile && profile.status === 'deleted') {
                console.log('User was marked as deleted, reactivating...');
                
                const { error: updateError } = await window.App.supabase
                    .from('profiles')
                    .update({ 
                        status: 'active',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', userId);
                    
                if (!updateError) {
                    console.log('User reactivated successfully');
                } else {
                    console.log('Failed to reactivate user:', updateError);
                }
            }
        } catch (error) {
            console.log('Error checking/reactivating user:', error);
            // Don't throw error, just log it - this shouldn't break auth flow
        }
    },

    // Logout function
    async logout() {
        try {
            await window.App.signOut();
            window.location.href = 'login.html?logout=true';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = 'login.html?logout=true';
        }
    },
    
    // Debug helper to check current auth state
    async debugAuth() {
        console.log('=== AUTH DEBUG ===');
        console.log('Current URL:', window.location.href);
        console.log('Pathname:', window.location.pathname);
        console.log('App available:', !!window.App);
        console.log('Supabase available:', !!window.App?.supabase);
        
        try {
            const session = await window.App?.getSession();
            console.log('Session:', session ? 'Found' : 'None');
            console.log('User:', session?.user?.email || 'None');
            console.log('Is Admin:', session?.user ? window.App.isAdmin(session.user) : 'N/A');
        } catch (error) {
            console.log('Session check error:', error);
        }
        console.log('==================');
    }
};

// Add global debug function
window.debugAuth = () => window.AuthHelper.debugAuth();
