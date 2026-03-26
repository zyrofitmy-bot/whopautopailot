
import { createClient } from '@supabase/supabase-js';

const url = 'https://rfmrqdlizotzxbuiqhrx.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXJxZGxpem90enhidWlxaHJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2MDg0MSwiZXhwIjoyMDkwMDM2ODQxfQ.t8psNFiplxWtLDUV24i3SxTrfE49W2RM66jD5lHR5uI';

const supabase = createClient(url, serviceKey);

async function setupBundle() {
    console.log('--- Setting up Test Bundle ---');
    
    // 1. Find the test services I created earlier
    const { data: svcLikes } = await supabase.from('services').select('id').eq('provider_service_id', '101').single();
    const { data: svcFollowers } = await supabase.from('services').select('id').eq('provider_service_id', '201').single();
    
    if (!svcLikes || !svcFollowers) {
        console.error('Test services 101/201 not found.');
        return;
    }

    // 2. Create Bundle
    const { data: bundle, error: bErr } = await supabase.from('engagement_bundles').upsert({
        name: 'Instagram Starter Pack',
        platform: 'instagram',
        description: 'Starter engagement for new accounts',
        is_active: true
    }).select().single();
    
    if (bErr) { console.error('Bundle Error:', bErr.message); return; }
    console.log('Bundle created:', bundle.id);

    // 3. Create Bundle Items
    await supabase.from('bundle_items').upsert([
        {
            bundle_id: bundle.id,
            service_id: svcLikes.id,
            engagement_type: 'likes',
            ratio_percent: 10,
            is_base: false,
            sort_order: 1
        },
        {
            bundle_id: bundle.id,
            service_id: svcFollowers.id,
            engagement_type: 'followers',
            ratio_percent: 5,
            is_base: false,
            sort_order: 2
        }
    ]);
    console.log('Bundle items created.');
}

setupBundle();
