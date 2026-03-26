
import { createClient } from '@supabase/supabase-js';

const url = 'https://rfmrqdlizotzxbuiqhrx.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXJxZGxpem90enhidWlxaHJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2MDg0MSwiZXhwIjoyMDkwMDM2ODQxfQ.t8psNFiplxWtLDUV24i3SxTrfE49W2RM66jD5lHR5uI';

const supabase = createClient(url, serviceKey);

async function verifyEngagementFlow() {
    const email = 'test_user_sub@example.com';
    const password = 'TestUser123!';
    
    console.log('--- TEST CASE 4: Engagement Order & Scheduling ---');
    
    // 1. Login
    const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
    if (authErr) { console.error('Auth Error:', authErr.message); return; }
    const token = auth.session.access_token;
    const userId = auth.user.id;
    console.log('Logged in as:', email);

    // 2. Find Bundle
    const { data: bundle } = await supabase.from('engagement_bundles').select('id').eq('name', 'Instagram Starter Pack').single();
    if (!bundle) { console.error('Bundle not found.'); return; }

    // 3. Invoke Function
    console.log('Invoking process-engagement-order...');
    const body = {
        user_id: userId,
        bundle_id: bundle.id,
        link: 'https://instagram.com/test_post',
        base_quantity: 1000,
        total_price: 15.00,
        is_organic_mode: true,
        engagements: [
            { type: 'likes', quantity: 100, price: 5.00 },
            { type: 'followers', quantity: 50, price: 10.00 }
        ]
    };

    const res = await fetch(`${url}/functions/v1/process-engagement-order`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    const data = await res.json();
    console.log('Response Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (res.status === 200) {
        console.log('--- Order Created Successfully! Checking Background Schedule... ---');
        // Wait for background worker to populate runs
        console.log('Waiting 5s for background worker...');
        await new Promise(r => setTimeout(r, 5000));

        const { data: runs } = await supabase.from('organic_run_schedule').select('*')
            .not('engagement_order_item_id', 'is', null)
            .order('scheduled_at', { ascending: true })
            .limit(10);

        if (runs && runs.length > 0) {
            console.log(`--- TEST CASE 4 SUCCESS: ${runs.length} runs generated! ---`);
            console.log('First Run:', JSON.stringify(runs[0], null, 2));
        } else {
            console.error('FAILED: No runs generated in background.');
        }

        // Final check: wallet balance
        const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', userId).single();
        console.log('Remaining Balance:', wallet.balance);
    } else {
        console.error('FAILED: Order process returned error.');
    }
}

verifyEngagementFlow();
