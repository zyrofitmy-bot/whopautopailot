
import { createClient } from '@supabase/supabase-js';

const url = 'https://rfmrqdlizotzxbuiqhrx.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXJxZGxpem90enhidWlxaHJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2MDg0MSwiZXhwIjoyMDkwMDM2ODQxfQ.t8psNFiplxWtLDUV24i3SxTrfE49W2RM66jD5lHR5uI';

const supabase = createClient(url, serviceKey);

async function fixSubscription() {
    const userId = '0d7259bc-edcb-43a3-8a82-9f4bca9f4555';
    
    console.log('--- Fixing Subscription for Test User ---');
    
    const { data, error } = await supabase.from('subscriptions').upsert({
        user_id: userId,
        status: 'active',
        plan_type: 'premium',
        current_period_end: new Date(Date.now() + 30 * 86400000).toISOString()
    }, { onConflict: 'user_id' }).select();
    
    if (error) console.error('Error:', error.message);
    else console.log('Subscription updated to PREMIUM!');

    // Also fix for the user's accounts
    const otherUsers = ['c5f934a0-79e2-493b-95a6-5ab02105f560', 'a9354d3e-308f-4850-9e0a-0a233984a1db'];
    for (const id of otherUsers) {
        await supabase.from('subscriptions').upsert({
            user_id: id,
            status: 'active',
            plan_type: 'premium',
            current_period_end: new Date(Date.now() + 30 * 86400000).toISOString()
        }, { onConflict: 'user_id' });
        console.log(`Updated sub for user ${id}`);
    }
}

fixSubscription();
