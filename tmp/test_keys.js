
import { createClient } from '@supabase/supabase-js';

const url = 'https://rfmrqdlizotzxbuiqhrx.supabase.co';

// Legacy Key
const legacyKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXJxZGxpem90enhidWlxaHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NjA4NDEsImV4cCI6MjA5MDAzNjg0MX0.VVxqGqZU9BrzcnyRuN0YIYQC7HAPHDLcOWeOOwqhUnk';

// New Key
const newKey = 'sb_publishable_LVyv9Mdaw2m6CRDTgN4GsA_DXXqrfTA';

async function test(name, key) {
    console.log(`Testing ${name}...`);
    const supabase = createClient(url, key);
    try {
        const { data, error } = await supabase.from('profiles').select('id').limit(1);
        if (error) {
            console.log(`${name} Error:`, error.message);
        } else {
            console.log(`${name} Success!`);
        }
    } catch (e) {
        console.log(`${name} Exception:`, e.message);
    }
}

async function run() {
    await test('Legacy Key', legacyKey);
    await test('New Key', newKey);
}

run();
