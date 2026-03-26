
import { createClient } from '@supabase/supabase-js';

const url = 'https://rfmrqdlizotzxbuiqhrx.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXJxZGxpem90enhidWlxaHJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2MDg0MSwiZXhwIjoyMDkwMDM2ODQxfQ.t8psNFiplxWtLDUV24i3SxTrfE49W2RM66jD5lHR5uI';

const supabase = createClient(url, serviceKey);

async function testSubscriptionEnforcement() {
    const email = 'test_user_sub@example.com';
    const password = 'TestUser123!';
    
    console.log('--- TEST CASE 2: Subscription Enforcement ---');
    
    // 1. Login to get user JWT
    const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
    if (authErr) {
        console.error('Login failed:', authErr.message);
        return;
    }
    const token = auth.session.access_token;
    const userId = auth.user.id;
    console.log('Logged in as test user:', userId);

    // 2. Create a dummy order for this user (Wait, we need a service first)
    // I already setup 'Instagram Likes' in the DB with provider_service_id '101'
    const { data: svc } = await supabase.from('services').select('id').eq('provider_service_id', '101').single();
    if (!svc) {
        console.error('Service not found, run setup_test_data.js first.');
        return;
    }

    const { data: order, error: orderErr } = await supabase.from('orders').insert({
        user_id: userId,
        service_id: svc.id,
        link: 'https://test.com',
        quantity: 100,
        price: 0.05,
        status: 'pending'
    }).select().single();

    if (orderErr) {
        console.error('Order creation failed:', orderErr.message);
        return;
    }
    console.log('Created test order:', order.id);

    // 3. Attempt to process order via function (which checks subscription)
    console.log('Attempting to process order WITHOUT subscription...');
    const resNoSub = await fetch(`${url}/functions/v1/process-order`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ order_id: order.id })
    });
    
    const dataNoSub = await resNoSub.json();
    console.log('Response (No Sub):', resNoSub.status, dataNoSub.error || 'SUCCESS?');

    if (resNoSub.status === 403) {
        console.log('--- TEST CASE 2 SUCCESS: Subscription Enforcement Blocked Order ---');
    }

    // 4. TEST CASE 3: Add subscription and retry
    console.log('\n--- TEST CASE 3: Successful Order with Subscription ---');
    console.log('Adding active subscription...');
    await supabase.from('subscriptions').upsert({
        user_id: userId,
        status: 'active',
        plan_type: 'premium',
        current_period_end: new Date(Date.now() + 30 * 86400000).toISOString()
    });

    console.log('Retrying order processing WITH subscription...');
    const resWithSub = await fetch(`${url}/functions/v1/process-order`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ order_id: order.id })
    });
    
    const dataWithSub = await resWithSub.json();
    console.log('Response (With Sub):', resWithSub.status, dataWithSub.success ? 'SUCCESS (Sent to Provider)' : (dataWithSub.error || 'FAILED'));

    if (dataWithSub.success || dataWithSub.error.includes('Provider API error')) {
        console.log('--- TEST CASE 3 SUCCESS: Subscription Check Passed ---');
    }
}

testSubscriptionEnforcement();
