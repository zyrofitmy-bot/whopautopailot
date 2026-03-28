import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rfmrqdlizotzxbuiqhrx.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXJxZGxpem90enhidWlxaHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NjA4NDEsImV4cCI6MjA5MDAzNjg0MX0.VVxqGqZU9BrzcnyRuN0YIYQC7HAPHDLcOWeOOwqhUnk'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function check() {
  console.log('--- Checking Last 50 runs ---')
  const { data, error } = await supabase
    .from('organic_run_schedule')
    .select('*, engagement_order_item:engagement_order_items(engagement_type, engagement_order:engagement_orders(id, link))')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log(`Found ${data?.length || 0} runs`);
  data?.forEach(r => {
    const link = r.engagement_order_item?.engagement_order?.link || 'No Link'
    console.log(`[Order ${r.engagement_order_item?.engagement_order?.id?.split('-')[0] || '?'}] Run #${r.run_number} | Status: ${r.status} | Link: ${link.substring(0, 40)}...`)
    if (r.error_message) console.log(`   Error: ${r.error_message}`)
  });
  
  // Also check engagement_orders directly if possible
  const { data: orders } = await supabase
    .from('engagement_orders')
    .select('id, status, link, created_at')
    .order('created_at', { ascending: false })
    .limit(10)
  
  console.log('\n--- Recent Engagement Orders ---')
  orders?.forEach(o => {
    console.log(`Order ID: ${o.id} | Status: ${o.status} | Link: ${o.link.substring(0, 40)}...`)
  })
}

check();
