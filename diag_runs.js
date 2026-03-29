const url = 'https://rfmrqdlizotzxbuiqhrx.supabase.co/rest/v1/organic_run_schedule?select=id,status,run_number,engagement_order_item_id,engagement_order_items(engagement_type,engagement_orders(link))&status=eq.pending&order=scheduled_at.asc&limit=100';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXJxZGxpem90enhidWlxaHJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2MDg0MSwiZXhwIjoyMDkwMDM2ODQxfQ.t8psNFiplxWtLDUV24i3SxTrfE49W2RM66jD5lHR5uI';

fetch(url, { headers: { 'apikey': key, 'Authorization': 'Bearer ' + key } })
  .then(res => res.json())
  .then(data => {
    let counts = {};
    data.forEach(r => {
      counts[r.engagement_order_item_id] = (counts[r.engagement_order_item_id] || 0) + 1;
    });
    console.log(`Found ${data.length} pending runs. Breakdown by Item ID:`, counts);
    process.exit(0);
  }).catch(e => {
    console.error(e);
    process.exit(1);
  });
