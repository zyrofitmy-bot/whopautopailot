import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rfmrqdlizotzxbuiqhrx.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXJxZGxpem90enhidWlxaHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NjA4NDEsImV4cCI6MjA5MDAzNjg0MX0.VVxqGqZU9BrzcnyRuN0YIYQC7HAPHDLcOWeOOwqhUnk'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function debugOrder49() {
  console.log('--- Debugging Order #49 ---')
  
  // Try to find in engagement_orders first
  const { data: eOrders, error: eError } = await supabase
    .from('engagement_orders')
    .select('id, status, link, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (eError) {
    console.error('Error fetching engagement_orders:', eError.message)
  } else {
    console.log(`Found ${eOrders?.length || 0} recent engagement orders`)
    // Find one that might be "49"
    // Usually users see IDs like "Order #1234". We'll look for numeric IDs or counts.
    const order49 = eOrders?.[48] // 49th order if sorted correctly? 
    // Wait, Order 49 might be an incremental ID.
  }
  
  // Check runs with run_number = 49 (Wait, run_number is per item)
  // Let's check for any run that is "pending" and 
  const { data: pendingRuns, error: pError } = await supabase
    .from('organic_run_schedule')
    .select(`
      id, run_number, status, scheduled_at, error_message, provider_status,
      engagement_order_item_id,
      engagement_order_item:engagement_order_items(
        engagement_type,
        engagement_order:engagement_orders(id, link)
      )
    `)
    .eq('status', 'pending')
    .order('scheduled_at', { ascending: true })
    .limit(20)

  if (pError) {
    console.error('Error fetching pending runs:', pError.message)
  }

  console.log('\nPending runs in queue:')
  pendingRuns?.forEach(r => {
    console.log(`- Run #${r.run_number} for Order ${r.engagement_order_item?.engagement_order?.id || '?'}`)
    console.log(`  Link: ${r.engagement_order_item?.engagement_order?.link || '?'}`)
    console.log(`  Scheduled: ${r.scheduled_at}, Type: ${r.engagement_order_item?.engagement_type}`)
    console.log(`  Last error: ${r.error_message || 'None'}`)
    console.log(`  Provider status: ${r.provider_status || 'None'}`)
    console.log('---')
  })
}

debugOrder49()
