import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(5)
    
  if (error) {
    console.error('Error fetching pending runs:', error)
    return
  }
  
  console.log(`Found ${pendingRuns?.length || 0} overdue pending view runs.`)
  if (pendingRuns && pendingRuns.length > 0) {
    console.log(JSON.stringify(pendingRuns, null, 2))
    
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
      console.log(JSON.stringify(activeRuns, null, 2))
    }
  }
}

checkPendingRuns()
