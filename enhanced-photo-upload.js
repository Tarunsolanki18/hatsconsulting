// ENHANCED PHOTO UPLOAD FUNCTIONALITY
// Add this to your app.js or use as a replacement for the uploadProof function

// Enhanced upload function with multiple fallback methods
const uploadPhoto = async (userId, file, options = {}) => {
    const { 
        bucket = 'proofs',
        maxSize = 5 * 1024 * 1024, // 5MB default
        allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        useBase64Fallback = true
    } = options;

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
    }

    // Validate file size
    if (file.size > maxSize) {
        throw new Error(`File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`);
    }

    try {
        console.log('🔄 Attempting Supabase storage upload...');
        
        // Method 1: Try Supabase Storage upload
        const fileName = `${userId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        const { data, error } = await window.App.supabase.storage
            .from(bucket)
            .upload(fileName, file, { 
                upsert: true,
                contentType: file.type
            });

        if (error) {
            console.log('Storage upload failed:', error.message);
            throw error;
        }

        // Get public URL
        const { data: urlData } = window.App.supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

        console.log('✅ Storage upload successful!');
        return {
            success: true,
            data: {
                path: data.path,
                publicUrl: urlData.publicUrl,
                method: 'storage'
            }
        };

    } catch (storageError) {
        console.log('⚠️ Storage upload failed, trying fallback methods...');
        
        if (!useBase64Fallback) {
            throw storageError;
        }

        try {
            console.log('🔄 Attempting base64 fallback...');
            
            // Method 2: Base64 fallback (store in database)
            const base64 = await fileToBase64(file);
            
            // Store in user profile or a dedicated table
            const photoRecord = {
                id: `${userId}_${Date.now()}`,
                user_id: userId,
                file_name: file.name,
                file_type: file.type,
                file_size: file.size,
                base64_data: base64,
                created_at: new Date().toISOString()
            };

            // Try to create photos table if it doesn't exist
            try {
                await window.App.supabase
                    .from('user_photos')
                    .insert(photoRecord);
            } catch (tableError) {
                // If table doesn't exist, store directly in profile
                console.log('Photos table not found, storing in profile...');
                await window.App.supabase
                    .from('profiles')
                    .update({ 
                        photo_url: base64,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', userId);
            }

            console.log('✅ Base64 fallback successful!');
            return {
                success: true,
                data: {
                    publicUrl: base64,
                    method: 'base64'
                }
            };

        } catch (base64Error) {
            console.error('❌ All upload methods failed:', {
                storage: storageError.message,
                base64: base64Error.message
            });
            
            throw new Error(`Upload failed: ${storageError.message}`);
        }
    }
};

// Helper function to convert file to base64
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// Enhanced profile photo upload for dashboard
const uploadProfilePhoto = async () => {
    const fileInput = document.getElementById('photo-upload');
    const file = fileInput.files[0];
    
    if (!file) return;

    // Show loading state
    const profileImg = document.getElementById('profile-photo');
    const originalSrc = profileImg.src;
    profileImg.style.opacity = '0.5';
    
    // Add loading spinner
    const loadingSpinner = document.createElement('div');
    loadingSpinner.innerHTML = '<i class="fas fa-spinner fa-spin text-2xl"></i>';
    loadingSpinner.className = 'absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full';
    profileImg.parentElement.appendChild(loadingSpinner);

    try {
        console.log('🔄 Starting profile photo upload...');
        
        // Upload photo with avatar-specific settings
        const result = await uploadPhoto(currentUser.id, file, {
            bucket: 'avatars',
            maxSize: 2 * 1024 * 1024, // 2MB for avatars
            useBase64Fallback: true
        });

        // Update profile in database
        await window.App.supabase
            .from('profiles')
            .update({ 
                photo_url: result.data.publicUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentUser.id);

        // Update UI
        profileImg.src = result.data.publicUrl;
        profileImg.style.opacity = '1';

        // Show success message
        if (typeof showNotification === 'function') {
            showNotification('Profile photo updated successfully! 📸', 'success');
        } else {
            alert('Profile photo updated successfully!');
        }

        console.log('✅ Profile photo upload complete!');

    } catch (error) {
        console.error('❌ Profile photo upload failed:', error);
        
        // Reset UI
        profileImg.src = originalSrc;
        profileImg.style.opacity = '1';
        
        // Show error message
        const errorMsg = error.message.includes('Invalid file type') 
            ? 'Please upload a valid image file (JPG, PNG, GIF, or WEBP)'
            : error.message.includes('File too large')
            ? 'Image is too large. Please use an image smaller than 2MB'
            : 'Failed to upload photo. Please try again.';
            
        if (typeof showNotification === 'function') {
            showNotification(errorMsg, 'error');
        } else {
            alert(errorMsg);
        }
    } finally {
        // Remove loading spinner
        if (loadingSpinner) {
            loadingSpinner.remove();
        }
        fileInput.value = ''; // Reset file input
    }
};

// Enhanced upload for report proofs
const uploadReportProof = async (userId, file, proofType = 'general') => {
    try {
        console.log(`🔄 Uploading ${proofType} proof...`);
        
        const result = await uploadPhoto(userId, file, {
            bucket: 'proofs',
            maxSize: 10 * 1024 * 1024, // 10MB for proof files
            allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
            useBase64Fallback: true
        });

        console.log(`✅ ${proofType} proof upload successful!`);
        return result;

    } catch (error) {
        console.error(`❌ ${proofType} proof upload failed:`, error);
        throw error;
    }
};

// Replace the existing uploadProof function in app.js
if (typeof window.App !== 'undefined') {
    window.App.uploadPhoto = uploadPhoto;
    window.App.uploadProfilePhoto = uploadProfilePhoto;
    window.App.uploadReportProof = uploadReportProof;
    
    // Keep backward compatibility
    window.App.uploadProof = uploadReportProof;
}

// Export for manual testing
if (typeof console !== 'undefined') {
    console.log('📸 Enhanced photo upload functions loaded!');
    console.log('Available functions: uploadPhoto, uploadProfilePhoto, uploadReportProof');
}