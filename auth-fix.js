// AuthHelper - Handles authentication and user session management
class AuthHelper {
    static async initPage(requireAdmin = false) {
        try {
            // Check if user is logged in
            const session = await window.App.getSession();
            
            if (!session) {
                window.location.href = 'login.html';
                return null;
            }

            // Get user profile
            const { data: profile } = await window.App.supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            // Update last login time
            await window.App.supabase
                .from('profiles')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', session.user.id);

            return session.user;
            
        } catch (error) {
            console.error('Auth error:', error);
            await this.logout();
            return null;
        }
    }

    static async logout() {
        try {
            await window.App.signOut();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            window.location.href = 'login.html';
        }
    }
}
