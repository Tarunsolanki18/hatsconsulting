// TEMPORARY FIX: Add this to your admin panel console
// This bypasses the schema cache issue by creating campaigns with minimal fields

// Option 1: Create campaign with just essential fields
async function createCampaignMinimal() {
    try {
        const { data, error } = await window.App.supabase
            .from('campaigns')
            .insert({
                name: 'Test Campaign',
                // Don't include campaign_type initially
            })
            .select();
            
        if (error) {
            console.error('Error:', error);
        } else {
            console.log('Success:', data);
            // Now update with missing fields
            const { error: updateError } = await window.App.supabase
                .from('campaigns')
                .update({
                    campaign_type: 'account_open',
                    is_active: true,
                    reward_amount: 100
                })
                .eq('id', data[0].id);
                
            if (updateError) {
                console.error('Update error:', updateError);
            } else {
                console.log('Campaign created and updated successfully!');
            }
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

// Option 2: Check what columns actually exist
async function checkCampaignsSchema() {
    try {
        const { data, error } = await window.App.supabase
            .from('campaigns')
            .select('*')
            .limit(1);
            
        if (data && data.length > 0) {
            console.log('Existing columns in campaigns table:', Object.keys(data[0]));
        } else {
            console.log('No existing campaigns found');
        }
        
        if (error) {
            console.error('Error checking schema:', error);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

// Run these functions in your browser console:
console.log('Run: checkCampaignsSchema() to see current columns');
console.log('Run: createCampaignMinimal() to create a test campaign');