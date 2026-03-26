
const url = 'https://rfmrqdlizotzxbuiqhrx.supabase.co/rest/v1/profiles?select=id&limit=1';
const sb_key = 'sb_publishable_LVyv9Mdaw2m6CRDTgN4GsA_DXXqrfTA';
const jwt_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXJxZGxpem90enhidWlxaHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NjA4NDEsImV4cCI6MjA5MDAzNjg0MX0.VVxqGqZU9BrzcnyRuN0YIYQC7HAPHDLcOWeOOwqhUnk';

async function testKey(name, key) {
    try {
        const res = await fetch(url, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });
        const text = await res.text();
        console.log(`[${name}] Status: ${res.status}, Body: ${text.substring(0, 50)}`);
    } catch(e) {
        console.log(`[${name}] Error: ${e.message}`);
    }
}

async function runTest() {
    await testKey('SB Key', sb_key);
    await testKey('JWT Key', jwt_key);
}
runTest();
