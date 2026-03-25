// Quick sync: calls import-services edge function to refresh prices for all yoyo services
const https = require('https');

const SUPABASE_URL = 'https://nenuwlbnaxesmnpfjlrl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lbnV3bGJuYXhlc21ucGZqbHJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1OTY3MjksImV4cCI6MjA4ODE3MjcyOX0.DM1vKF5CJxrwg5T_XJE_nr5LTNtr4pKNkTQUqvPhuiY';

const SERVICE_IDS = ['13636', '7515', '13362', '13384', '10026', '11674'];

function supabaseGet(path) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, SUPABASE_URL);
        const req = https.request({
            method: 'GET',
            hostname: url.hostname,
            path: url.pathname + url.search,
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch { resolve(data); }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

function callEdgeFunction(name, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(`/functions/v1/${name}`, SUPABASE_URL);
        const bodyStr = JSON.stringify(body);
        const req = https.request({
            method: 'POST',
            hostname: url.hostname,
            path: url.pathname,
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr),
            },
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, data }); }
            });
        });
        req.on('error', reject);
        req.write(bodyStr);
        req.end();
    });
}

async function main() {
    console.log('=== Syncing Service Prices from Provider API ===\n');

    // Step 1: Get provider_id from one of the existing services
    console.log('1. Finding provider_id from existing services...');
    const services = await supabaseGet(
        `/rest/v1/services?provider_service_id=in.(${SERVICE_IDS.join(',')})`
        + '&select=id,provider_id,provider_service_id,name,price'
    );

    if (!Array.isArray(services) || services.length === 0) {
        console.error('ERROR: No services found! services response:', services);
        process.exit(1);
    }

    // Group by provider_id
    const byProvider = {};
    for (const s of services) {
        if (!byProvider[s.provider_id]) byProvider[s.provider_id] = [];
        byProvider[s.provider_id].push(s);
    }

    console.log(`   Found ${services.length} services across ${Object.keys(byProvider).length} provider(s)`);
    for (const s of services) {
        console.log(`   - ${s.name}: price=${s.price}, provider_service_id=${s.provider_service_id}`);
    }

    // Step 2: Call import-services for each provider
    console.log('\n2. Calling import-services edge function...');
    for (const [providerId, providerServices] of Object.entries(byProvider)) {
        const serviceIds = providerServices.map(s => s.provider_service_id);
        console.log(`\n   Provider: ${providerId}`);
        console.log(`   Service IDs: ${serviceIds.join(', ')}`);

        const result = await callEdgeFunction('import-services', {
            provider_id: providerId,
            action: 'import',
            service_ids: serviceIds,
        });

        console.log(`   Status: ${result.status}`);
        console.log(`   Response:`, JSON.stringify(result.data, null, 2));
    }

    // Step 3: Verify updated prices
    console.log('\n3. Verifying updated prices...');
    const updated = await supabaseGet(
        `/rest/v1/services?provider_service_id=in.(${SERVICE_IDS.join(',')})`
        + '&select=provider_service_id,name,price'
    );

    if (Array.isArray(updated)) {
        console.log('\n   Updated prices:');
        for (const s of updated) {
            console.log(`   ✅ ${s.name}: $${s.price}/1K`);
        }
    }

    console.log('\n=== Done! Refresh your page to see updated prices. ===');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
