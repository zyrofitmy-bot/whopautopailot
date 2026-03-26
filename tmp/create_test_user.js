
import { createClient } from '@supabase/supabase-js';

const url = 'https://rfmrqdlizotzxbuiqhrx.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXJxZGxpem90enhidWlxaHJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2MDg0MSwiZXhwIjoyMDkwMDM2ODQxfQ.t8psNFiplxWtLDUV24i3SxTrfE49W2RM66jD5lHR5uI';

const supabase = createClient(url, serviceKey);

async function createStandardUser() {
    const email = 'test_user_sub@example.com';
    const password = 'TestUser123!';
    
    console.log('--- Creating Standard Test User ---');
    
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Test Subscriber' }
    });
    
    if (error) {
        if (error.message.includes('already registered')) {
            console.log('User already exists.');
        } else {
            console.error('Error:', error.message);
            return;
        }
    } else {
        console.log('User created:', data.user.id);
    }
}

createStandardUser();
