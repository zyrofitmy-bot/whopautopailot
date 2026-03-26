
import { createClient } from '@supabase/supabase-js';

const url = 'https://rfmrqdlizotzxbuiqhrx.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXJxZGxpem90enhidWlxaHJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2MDg0MSwiZXhwIjoyMDkwMDM2ODQxfQ.t8psNFiplxWtLDUV24i3SxTrfE49W2RM66jD5lHR5uI';

const supabase = createClient(url, serviceKey);

async function createQAAdmin() {
    const email = 'qa_admin@example.com';
    const password = 'QAPassword123!';
    
    console.log('--- Creating QA Admin User ---');
    
    // 1. Create User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'QA Admin Agent' }
    });
    
    if (authError) {
        if (authError.message.includes('already registered')) {
            console.log('User already exists, proceeding to role check...');
        } else {
            console.error('Error creating user:', authError.message);
            return;
        }
    }
    
    const userId = authData.user?.id || (await supabase.from('profiles').select('user_id').eq('email', email).single()).data?.user_id;
    
    if (!userId) {
        console.error('Could not get user ID');
        return;
    }
    
    console.log('User ID:', userId);
    
    // 2. Ensure Role exists and is admin
    const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id' })
        .select();
        
    if (roleError) {
        console.error('Error setting admin role:', roleError.message);
    } else {
        console.log('Admin role set successfully!');
    }

    // 3. Ensure Wallet exists
    await supabase.from('wallets').upsert({ user_id: userId, balance: 1000 }, { onConflict: 'user_id' });
    console.log('Wallet initialized with $1000');
}

createQAAdmin();
