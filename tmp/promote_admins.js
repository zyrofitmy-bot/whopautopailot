
import { createClient } from '@supabase/supabase-js';

const url = 'https://rfmrqdlizotzxbuiqhrx.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXJxZGxpem90enhidWlxaHJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2MDg0MSwiZXhwIjoyMDkwMDM2ODQxfQ.t8psNFiplxWtLDUV24i3SxTrfE49W2RM66jD5lHR5uI';

const supabase = createClient(url, serviceKey);

async function promoteAll() {
    const emails = ['just4abhii@gmail.com', 'rayapushanker@gmail.com'];
    
    for (const email of emails) {
        console.log(`Checking ${email}...`);
        const { data: user, error } = await supabase.from('profiles').select('user_id').eq('email', email).maybeSingle();
        
        const userId = user?.user_id;
        if (!userId) {
            // Try to find in auth.users
            const { data: authUsers } = await supabase.auth.admin.listUsers();
            const authUser = authUsers.users.find(u => u.email === email);
            if (authUser) {
                console.log(`Found ${email} in auth.users, creating profile...`);
                await supabase.from('profiles').upsert({ user_id: authUser.id, email: email, full_name: 'Admin' });
                await promote(authUser.id);
            } else {
                console.log(`${email} not found.`);
            }
        } else {
            await promote(userId);
        }
    }
}

async function promote(userId) {
    const { error } = await supabase.from('user_roles').upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' });
    if (error) console.error('Error:', error.message);
    else console.log(`SUCCESS: ${userId} is now admin.`);
}

promoteAll();
