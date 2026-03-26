
import { createClient } from '@supabase/supabase-js';

const url = 'https://rfmrqdlizotzxbuiqhrx.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXJxZGxpem90enhidWlxaHJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2MDg0MSwiZXhwIjoyMDkwMDM2ODQxfQ.t8psNFiplxWtLDUV24i3SxTrfE49W2RM66jD5lHR5uI';

const supabase = createClient(url, serviceKey);

async function setupTestData() {
    console.log('--- Setting up Test Provider & Services ---');
    
    // 1. Create a Test Provider
    const providerId = 'yoyo_media_test';
    await supabase.from('providers').upsert({
        id: providerId,
        name: 'YoYo Media (Test)',
        api_url: 'https://yoyomedia.com/api/v2',
        api_key: 'test_api_key_123',
        is_active: true
    });
    console.log('Provider processed.');

    // 2. Create some initial services
    const services = [
        {
            provider_id: providerId,
            provider_service_id: '101',
            name: 'Instagram Likes [Real & Fast]',
            category: 'Instagram Likes',
            price: 0.50,
            min_quantity: 100,
            max_quantity: 50000,
            speed: 'instant',
            quality: 'high',
            is_active: true
        },
        {
            provider_id: providerId,
            provider_service_id: '201',
            name: 'Instagram Followers [HQ]',
            category: 'Instagram Followers',
            price: 1.20,
            min_quantity: 100,
            max_quantity: 100000,
            speed: 'medium',
            quality: 'premium',
            is_active: true
        }
    ];

    for (const s of services) {
        // Check if exists
        const { data: existing } = await supabase.from('services').select('id').eq('provider_id', s.provider_id).eq('provider_service_id', s.provider_service_id).maybeSingle();
        if (existing) {
            await supabase.from('services').update(s).eq('id', existing.id);
            console.log(`Updated: ${s.name}`);
        } else {
            await supabase.from('services').insert(s);
            console.log(`Inserted: ${s.name}`);
        }
    }

    console.log('Test data setup complete.');
}

setupTestData();
