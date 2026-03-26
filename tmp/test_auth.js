
import { createClient } from '@supabase/supabase-js';

const url = 'https://rfmrqdlizotzxbuiqhrx.supabase.co';
const key = 'sb_publishable_LVyv9Mdaw2m6CRDTgN4GsA_DXXqrfTA';

async function testAuth() {
    const supabase = createClient(url, key);
    
    // Test 1: Basic connectivity
    console.log('Test 1: Basic query...');
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) console.log('  FAIL:', error.message);
    else console.log('  PASS: Query works');

    // Test 2: Auth signup (with a dummy email to test the auth endpoint)
    console.log('Test 2: Auth endpoint reachable...');
    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: 'test-verify-' + Date.now() + '@example.com',
            password: 'testpassword123',
        });
        if (authError) {
            // "rate limit" or "already registered" means auth endpoint is working
            console.log('  Auth response:', authError.message);
            if (authError.message.toLowerCase().includes('invalid api key')) {
                console.log('  FAIL: Invalid API key error persists!');
            } else {
                console.log('  PASS: Auth endpoint works (error is not about API key)');
            }
        } else {
            console.log('  PASS: Auth signup succeeded');
        }
    } catch (e) {
        console.log('  Exception:', e.message);
    }
}

testAuth();
