
import { createClient } from '@supabase/supabase-js';

const url = 'https://rfmrqdlizotzxbuiqhrx.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXJxZGxpem90enhidWlxaHJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2MDg0MSwiZXhwIjoyMDkwMDM2ODQxfQ.t8psNFiplxWtLDUV24i3SxTrfE49W2RM66jD5lHR5uI';

const supabase = createClient(url, serviceKey);

async function setAdminFinal() {
    const email = 'just4abhii@gmail.com';
    
    console.log('--- Promoting User to Admin ---');
    
    // 1. Get User ID
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .single();
        
    if (error || !profile) {
        console.error('Error finding user:', error?.message || 'User not found in profiles');
        return;
    }
    
    const userId = profile.user_id;
    console.log('User ID:', userId);
    
    // 2. Assign Admin Role (Upsert or Update)
    // First, delete any existing non-admin roles for this user to ensure they only have admin if that's desired, 
    // or just ensure admin is there.
    const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' });
        
    if (roleError) {
        console.error('Error setting role:', roleError.message);
    } else {
        console.log('Admin role assigned successfully!');
    }

    // 3. Add some initial balance for testing
    await supabase.from('wallets')
        .update({ balance: 500 })
        .eq('user_id', userId);
    console.log('Added $500 to wallet for testing.');
}

setAdminFinal();
