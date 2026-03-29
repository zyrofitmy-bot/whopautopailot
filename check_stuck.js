import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rfmrqdlizotzxbuiqhrx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXJxZGxpem90enhidWlxaHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NjA4NDEsImV4cCI6MjA5MDAzNjg0MX0.VVxqGqZU9BrzcnyRuN0YIYQC7HAPHDLcOWeOOwqhUnk'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPendingRuns() {
  console.log('Checking pending runs...')
  
  // Get pending runs for engagement type 'views'
  const { data: pendingRuns, error } = await supabase
    .from('organic_run_schedule')
    .select(`
      id,
      run_number,
      status,
      scheduled_at,
      engagement_order_item_id,
      engagement_order_item:engagement_order_items!inner(
        id,
        engagement_type,
        service_id,
        engagement_order:engagement_orders!inner(
          id,
          link,
          status
        )
      )
    `)
    .eq('status', 'pending')
    .eq('engagement_order_item.engagement_type', 'views')
    .order('scheduled_at', { ascending: true })
    .limit(5)
    
  if (error) {
    console.error('Error fetching pending runs:', error)
    return
  }
  
  console.log(`Found ${pendingRuns?.length || 0} pending view runs.`)
  if (pendingRuns && pendingRuns.length > 0) {
    console.log(JSON.stringify(pendingRuns.map(r => ({
      id: r.id, run: r.run_number, status: r.status, link: (r.engagement_order_item as any).engagement_order.link, scheduled: r.scheduled_at 
    })), null, 2))
    
    // Check if there are ANY active runs globally for this link
    const sampleRun = pendingRuns[0]
    const link = (sampleRun.engagement_order_item as any).engagement_order.link
    
    console.log(`\nChecking active runs for link: ${link}`)
    
    const { data: activeRuns, error: activeErr } = await supabase
      .from('organic_run_schedule')
      .select(`
        id, run_number, status, provider_status,
        engagement_order_item:engagement_order_items!inner(
          id, engagement_type,
          engagement_order:engagement_orders!inner(link)
        )
      `)
      .in('status', ['started', 'in_progress'])
      .eq('engagement_order_item.engagement_order.link', link)
      
    if (activeErr) {
      console.error('Error fetching active runs:', activeErr)
    } else {
      console.log(`Found ${activeRuns?.length || 0} active runs for this link:`)
      console.log(JSON.stringify(activeRuns.map(r => ({
        id: r.id, run: r.run_number, status: r.status, p_status: r.provider_status
      })), null, 2))
    }
  }
}

checkPendingRuns()
