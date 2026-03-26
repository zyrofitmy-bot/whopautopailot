
import { createClient } from '@supabase/supabase-js';

const url = 'https://rfmrqdlizotzxbuiqhrx.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXJxZGxpem90enhidWlxaHJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2MDg0MSwiZXhwIjoyMDkwMDM2ODQxfQ.t8psNFiplxWtLDUV24i3SxTrfE49W2RM66jD5lHR5uI';

const supabase = createClient(url, serviceKey);

async function setAdmin() {
    const email = 'just4abhii@gmail.com';
    
    // Check if user exists
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .single();
        
    if (error) {
        console.log('Error or user not found:', error.message);
        console.log('Waiting for user to sign up...');
        return;
    }
    
    console.log('User found! ID:', profile.user_id);
    
    // Update role
    const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('user_id', profile.user_id)
        .select();
        
    if (roleError) {
        console.log('Error updating role:', roleError.message);
    } else {
        console.log('Role updated successfully:', roleData);
    }
}

setAdmin();
