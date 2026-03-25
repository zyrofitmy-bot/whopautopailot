// Setup script: Configure yoyo provider mappings for all engagement types
// Run: node scripts/setup-yoyo-mappings.cjs

const https = require('https');

const SUPABASE_URL = 'https://nenuwlbnaxesmnpfjlrl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lbnV3bGJuYXhlc21ucGZqbHJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1OTY3MjksImV4cCI6MjA4ODE3MjcyOX0.DM1vKF5CJxrwg5T_XJE_nr5LTNtr4pKNkTQUqvPhuiY';

// Yoyo service IDs per engagement type
const YOYO_SERVICES = {
    views: '13636',
    likes: '7515',
    comments: '13362',
    reposts: '13384',
    shares: '10026',
    saves: '11674',
};

function supabaseRequest(method, path, body, authToken) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, SUPABASE_URL);
        const options = {
            method,
            hostname: url.hostname,
            path: url.pathname + url.search,
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${authToken || SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': method === 'GET' ? '' : 'return=representation',
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch {
                    resolve({ status: res.statusCode, data });
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function main() {
    console.log('=== Yoyo Provider Mapping Setup ===\n');

    // Step 1: Find the yoyo provider account
    console.log('1. Finding yoyo provider account...');
    const accountsRes = await supabaseRequest('GET', '/rest/v1/provider_accounts?name=ilike.*yoyo*&select=*');

    if (!accountsRes.data?.length) {
        console.error('ERROR: No yoyo provider account found!');
        console.log('Available accounts:', accountsRes.data);
        process.exit(1);
    }

    const yoyoAccount = accountsRes.data[0];
    console.log(`   Found: ${yoyoAccount.name} (id: ${yoyoAccount.id}, provider_id: ${yoyoAccount.provider_id})`);

    // Step 2: Find all Instagram bundle items
    console.log('\n2. Finding Instagram bundle items...');
    const bundlesRes = await supabaseRequest('GET', '/rest/v1/engagement_bundles?platform=eq.instagram&select=*,items:bundle_items(*)');

    if (!bundlesRes.data?.length) {
        console.error('ERROR: No Instagram bundles found!');
        process.exit(1);
    }

    console.log(`   Found ${bundlesRes.data.length} Instagram bundle(s)`);

    // Collect all bundle items across all bundles
    const allItems = [];
    for (const bundle of bundlesRes.data) {
        console.log(`   Bundle: ${bundle.name} (${bundle.items?.length || 0} items)`);
        if (bundle.items) {
            for (const item of bundle.items) {
                allItems.push(item);
                console.log(`     - ${item.engagement_type} (id: ${item.id}, service_id: ${item.service_id || 'none'})`);
            }
        }
    }

    // Step 3: For each engagement type, import the service and set up mapping
    console.log('\n3. Setting up services and mappings...\n');

    for (const [engType, providerServiceId] of Object.entries(YOYO_SERVICES)) {
        const items = allItems.filter(i => i.engagement_type === engType);

        if (items.length === 0) {
            console.log(`   SKIP: No bundle item found for "${engType}"`);
            continue;
        }

        const item = items[0];
        console.log(`   ${engType.toUpperCase()}: provider_service_id=${providerServiceId}`);

        // Check if service already exists
        let serviceRes = await supabaseRequest('GET',
            `/rest/v1/services?provider_id=eq.${yoyoAccount.provider_id}&provider_service_id=eq.${providerServiceId}&select=*`);

        let serviceId;

        if (serviceRes.data?.length > 0) {
            serviceId = serviceRes.data[0].id;
            console.log(`     Service exists: ${serviceRes.data[0].name} (id: ${serviceId})`);
        } else {
            // Need to import - call the import-services edge function
            console.log(`     Service not imported yet. Calling import-services...`);

            const importRes = await supabaseRequest('POST', '/functions/v1/import-services', {
                provider_id: yoyoAccount.provider_id,
                action: 'import',
                service_ids: [providerServiceId],
                category_override: `Instagram ${engType.charAt(0).toUpperCase() + engType.slice(1)}`,
            });

            if (importRes.data?.error) {
                console.log(`     IMPORT ERROR: ${importRes.data.error}`);
                continue;
            }

            console.log(`     Import result: ${JSON.stringify(importRes.data)}`);

            // Fetch the newly imported service
            serviceRes = await supabaseRequest('GET',
                `/rest/v1/services?provider_id=eq.${yoyoAccount.provider_id}&provider_service_id=eq.${providerServiceId}&select=*`);

            if (!serviceRes.data?.length) {
                console.log(`     ERROR: Failed to find imported service`);
                continue;
            }
            serviceId = serviceRes.data[0].id;
            console.log(`     Imported: ${serviceRes.data[0].name} (id: ${serviceId})`);
        }

        // Link service to bundle item if not already linked
        if (item.service_id !== serviceId) {
            console.log(`     Linking service to bundle item...`);
            const linkRes = await supabaseRequest('PATCH',
                `/rest/v1/bundle_items?id=eq.${item.id}`,
                { service_id: serviceId });
            console.log(`     Link result: status ${linkRes.status}`);
        } else {
            console.log(`     Already linked to bundle item`);
        }

        // Set up service_provider_mapping for yoyo
        const mappingRes = await supabaseRequest('GET',
            `/rest/v1/service_provider_mapping?service_id=eq.${serviceId}&provider_account_id=eq.${yoyoAccount.id}&select=*`);

        if (mappingRes.data?.length > 0) {
            // Update existing mapping
            console.log(`     Mapping exists, updating provider_service_id...`);
            await supabaseRequest('PATCH',
                `/rest/v1/service_provider_mapping?id=eq.${mappingRes.data[0].id}`,
                { provider_service_id: providerServiceId, is_active: true });
        } else {
            // Create new mapping
            console.log(`     Creating new mapping...`);
            const createRes = await supabaseRequest('POST',
                '/rest/v1/service_provider_mapping',
                {
                    service_id: serviceId,
                    provider_account_id: yoyoAccount.id,
                    provider_service_id: providerServiceId,
                    sort_order: yoyoAccount.priority || 1,
                    is_active: true,
                });
            console.log(`     Create result: status ${createRes.status}`);
        }

        console.log(`     ✅ ${engType} → ${providerServiceId} (yoyo)\n`);
    }

    console.log('\n=== Setup Complete! ===');
    console.log('Refresh the bundles page to see the changes.');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
