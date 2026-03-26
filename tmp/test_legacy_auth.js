
import { createClient } from '@supabase/supabase-js';

const url = 'https://rfmrqdlizotzxbuiqhrx.supabase.co';
const legacyAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXJxZGxpem90enhidWlxaHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NjA4NDEsImV4cCI6MjA5MDAzNjg0MX0.VVxqGqZU9BrzcnyRuN0YIYQC7HAPHDLcOWeOOwqhUnk';

async function testAuth() {
    const supabase = createClient(url, legacyAnonKey);

    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: 'test-verify-legacy-' + Date.now() + '@example.com',
            password: 'testpassword123',
        });
        if (authError) {
            console.log('Legacy Key Auth error:', authError.message);
        } else {
            console.log('Legacy Key Auth signup succeeded:', authData.user ? 'User created' : 'No user');
        }
    } catch (e) {
        console.log('Exception:', e.message);
    }
}

testAuth();
