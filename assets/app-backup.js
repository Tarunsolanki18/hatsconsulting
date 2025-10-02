// Core App utilities for Supabase and common helpers
(function () {
    const { SUPABASE_URL, SUPABASE_ANON_KEY, ADMIN_EMAILS, SECURITY_CODES, ADMIN_NOTIFY_WEBHOOK } = window.APP_CONFIG || {};
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
    const isAdmin = (user) => {
      if (!user || !user.email) return false;
      return (ADMIN_EMAILS || []).map(e => e.toLowerCase()).includes(user.email.toLowerCase());
    };
  
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      return data.session || null;
    };
  
    const requireAuth = async (options = {}) => {
      const { redirectTo = 'login.html' } = options;
      
      // Prevent redirect loops
      if (window.location.pathname.includes('login.html')) {
        return null;
      }
      
      const session = await getSession();
      if (!session && window.location.pathname !== '/' + redirectTo) {
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 100);
      }
      return session;
    };
  
    const requireAdmin = async (options = {}) => {
      try {
        const { redirectTo = 'login.html?force=true' } = options;
        
        // Prevent redirect loops
        if (window.location.pathname.includes('login.html')) {
          return null;
        }
        
        const session = await getSession();
        
        if (!session?.user) {
          console.log('No session found for admin check');
          if (window.location.pathname !== '/' + redirectTo.split('?')[0]) {
            setTimeout(() => {
              window.location.href = redirectTo;
            }, 100);
          }
          return null;
        }
        
        if (!isAdmin(session.user)) {
          console.error('User is not an admin:', session.user.email);
          if (window.location.pathname !== '/dashboard.html') {
            setTimeout(() => {
              window.location.href = 'dashboard.html';
            }, 100);
          }
          return null;
        }
        
        return session;
      } catch (error) {
        console.error('Admin authentication failed:', error);
        if (window.location.pathname !== '/login.html') {
          setTimeout(() => {
            window.location.href = 'login.html?force=true';
          }, 100);
        }
        return null;
      }
    };

    const signInWithEmail = async (email, password) => {
      if (password) {
        return await supabase.auth.signInWithPassword({ email, password });
      }
      return await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + '/public/dashboard.html' } });
    };

    const signUpWithEmail = async (email, password, fullName) => {
      return await supabase.auth.signUp({ 
        email, 
        password, 
        options: { 
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin + '/public/dashboard.html'
        } 
      });
    };

    const approveSelfWithCode = async (userId, code) => {
      const trimmed = (code || '').trim();
      if (!trimmed) return { error: { message: 'Security code required' } };
      
      // Check if code exists in config.js SECURITY_CODES array
      if (window.APP_CONFIG.SECURITY_CODES.includes(trimmed)) {
        return { data: true };
      }
      
      // Fallback to database check if not found in config
      const { data, error } = await supabase.rpc('approve_with_code', { p_code: trimmed });
      if (error) return { error };
      if (!data) return { error: { message: 'Invalid or expired code' } };
      return { data };
    };
  
    const notifyAdminsOfPendingSignup = async (email) => {
      try {
        if (!ADMIN_NOTIFY_WEBHOOK) return;
        await fetch(ADMIN_NOTIFY_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, message: `New signup pending approval: ${email}` })
        });
      } catch (error) {
        console.error('Failed to notify admins:', error);
      }
    };

    const signOut = async () => {
      try {
        // Clear all local storage and session storage
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
        
        // Call Supabase signOut
        const result = await supabase.auth.signOut();
        
        return result;
      } catch (error) {
        console.error('Error during signOut:', error);
        // Force clear storage even if Supabase call fails
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
        return { error };
      }
    };
  
    const upsertProfile = async (userId, profile) => {
      return await supabase.from('profiles').upsert({ id: userId, ...profile });
    };
  
    const fetchEarnings = async (userId) => {
      return await supabase.from('earnings').select('*').eq('user_id', userId).single();
    };
  

    const createReport = async (payload) => {
      return await supabase.from('reports').insert(payload).select().single();
    };
  
    const uploadProof = async (userId, file) => {
      try {
        // Sanitize file name to prevent issues
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${userId}/${Date.now()}_${sanitizedFileName}`;
        
        console.log('Uploading file:', fileName, 'Size:', file.size);
        
        // Check if file size is reasonable (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          return { error: { message: 'File size too large. Maximum 10MB allowed.' } };
        }
        
        // Try to upload to 'proofs' bucket
        const { data, error } = await supabase.storage
          .from('proofs')
          .upload(fileName, file, { 
            cacheControl: '3600',
            upsert: false 
          });
          
        if (error) {
          console.error('Storage upload error:', error);
          
          // If bucket doesn't exist, try to create it or use alternative
          if (error.message.includes('Bucket not found') || error.message.includes('bucket')) {
            console.log('Proofs bucket not found, trying alternative approach...');
            
            // Try uploading to a different bucket or create base64 URL
            return { error: { message: 'Storage bucket not configured. Please contact admin.' } };
          }
          
          return { error };
        }
        
        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('proofs')
          .getPublicUrl(data.path);
          
        console.log('File uploaded successfully:', publicUrlData.publicUrl);
        
        return { 
          data: { 
            path: data.path, 
            publicUrl: publicUrlData.publicUrl 
          } 
        };
        
      } catch (error) {
        console.error('Upload function error:', error);
        return { error: { message: 'Upload failed: ' + error.message } };
      }
    };
  
    const fetchCampaigns = async () => {
      return await supabase.from('campaigns').select('*').eq('is_active', true).order('updated_at', { ascending: false });
    };

    const fetchAllCampaigns = async () => {
      return await supabase.from('campaigns').select('*').order('updated_at', { ascending: false });
    };

    const createCampaign = async (campaign) => {
      return await supabase.from('campaigns').insert(campaign).select().single();
    };

    const updateCampaign = async (id, campaign) => {
      return await supabase.from('campaigns').update(campaign).eq('id', id).select().single();
    };

    const deleteCampaign = async (id) => {
      return await supabase.from('campaigns').delete().eq('id', id);
    };

    const fetchAllUsers = async () => {
      return await supabase.from('profiles').select('*');
    };

    const updateUserEarnings = async (userId, earnings) => {
      return await supabase.from('earnings').upsert({ user_id: userId, ...earnings }, { onConflict: 'user_id' });
    };

    const updateUserProfile = async (userId, profile) => {
      return await supabase.from('profiles').update(profile).eq('id', userId);
    };

    const deleteUser = async (userId) => {
      return await supabase.from('profiles').delete().eq('id', userId);
    };

    const fetchAllReports = async () => {
      return await supabase.from('reports').select('*').order('created_at', { ascending: false });
    };

    const updateReport = async (id, updates) => {
      return await supabase.from('reports').update(updates).eq('id', id).select().single();
    };

    const deleteReport = async (id) => {
      return await supabase.from('reports').delete().eq('id', id);
    };

    const fetchReportsWithFilters = async (filters = {}) => {
      let query = supabase.from('reports').select('*');
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.type) {
        query = query.eq('report_type', filters.type);
      }
      
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      
      return await query.order('created_at', { ascending: false });
    };

    const getDashboardStats = async () => {
      const { data: users } = await supabase.from('profiles').select('id');
      const { data: reports } = await supabase.from('reports').select('id');
      const { data: pendingReports } = await supabase.from('reports').select('id').eq('status', 'Received');
      const { data: checkedReports } = await supabase.from('reports').select('id').in('status', ['Approved', 'Rejected']);
      
      return {
        totalUsers: users?.length || 0,
        totalReports: reports?.length || 0,
        pendingReports: pendingReports?.length || 0,
        checkedReports: checkedReports?.length || 0
      };
    };
  
    // Added empty function to prevent errors after security code section removal
    const fetchSecurityCodes = async () => {
      return { data: [] };
    };
  
    window.App = {
      supabase,
      isAdmin,
      getSession,
      requireAuth,
      requireAdmin,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      upsertProfile,
      fetchEarnings,
      createReport,
      uploadProof,
      fetchCampaigns,
      fetchAllCampaigns,
      createCampaign,
      updateCampaign,
      deleteCampaign,
      fetchAllUsers,
      updateUserEarnings,
      updateUserProfile,
      deleteUser,
      fetchAllReports,
      updateReport,
      deleteReport,
      fetchReportsWithFilters,
      getDashboardStats,
      fetchSecurityCodes,
      approveSelfWithCode,
      notifyAdminsOfPendingSignup
    };
})();
