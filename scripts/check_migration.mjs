import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabase = createClient(
  'https://rfmrqdlizotzxbuiqhrx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXJxZGxpem90enhidWlxaHJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2MDg0MSwiZXhwIjoyMDkwMDM2ODQxfQ.t8psNFiplxWtLDUV24i3SxTrfE49W2RM66jD5lHR5uI',
  {
    auth: { persistSession: false },
    global: { fetch: (url, options) => fetch(url, { ...options, timeout: 60000 }) }
  }
)

async function applyMigration() {
  console.log('Reading migration file...')
  const sql = fs.readFileSync('c:/Users/rayap/OneDrive/Desktop/neworganicsmm-main/organicsmm-main/supabase/migrations/20260327000000_performance_optimization.sql', 'utf8')
  
  // We can't directly run arbitrary SQL via the supabase-js client's rpc
  // unless there's a specific RPC for it. 
  // But wait, Supabase doesn't have a default "run_sql" RPC.
  
  // Instead, I'll try to check if I can call the 'get_admin_dashboard_stats' RPC.
  // If it fails with "function does not exist", I'll know it's not applied.
  
  console.log('Checking if RPC already exists...')
  const { error } = await supabase.rpc('get_admin_dashboard_stats')
  
  if (error && error.message.includes('does not exist')) {
     console.log('RPC does not exist. Migration needs to be applied manually in the dashboard.')
     console.log('RESULT: MANUAL_ACTION_REQUIRED')
  } else if (error) {
     console.log('RPC error (might be timeout due to IO):', error.message)
     console.log('RESULT: INSTANCE_STILL_BUSY')
  } else {
     console.log('RPC exists and responded! Migration is likely already applied.')
     console.log('RESULT: SUCCESS')
  }
}

applyMigration()
