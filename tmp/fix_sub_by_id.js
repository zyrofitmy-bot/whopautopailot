
import { createClient } from '@supabase/supabase-js';

const url = 'https://rfmrqdlizotzxbuiqhrx.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXJxZGxpem90enhidWlxaHJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2MDg0MSwiZXhwIjoyMDkwMDM2ODQxfQ.t8psNFiplxWtLDUV24i3SxTrfE49W2RM66jD5lHR5uI';

const supabase = createClient(url, serviceKey);

async function fixSubByID() {
    const userId = '0d7259bc-edcb-43a3-8a82-9f4bca9f4555';
    
    console.log('--- Finding Sub ID ---');
    const { data: sub } = await supabase.from('subscriptions').select('id').eq('user_id', userId).single();
    
    if (!sub) {
        console.log('No sub found, inserting NEW...');
        await supabase.from('subscriptions').insert({
            user_id: userId,
            status: 'active',
            plan_type: 'premium',
            current_period_end: new Date(Date.now() + 30 * 86400000).toISOString()
        });
    } else {
        console.log('Found sub:', sub.id);
        const { error } = await supabase.from('subscriptions')
            .update({ status: 'active', plan_type: 'premium' })
            .eq('id', sub.id);
        if (error) console.error('Update Error:', error.message);
        else console.log('Update Successful!');
    }
}

fixSubByID();
