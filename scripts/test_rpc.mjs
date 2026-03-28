import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://rfmrqdlizotzxbuiqhrx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXJxZGxpem90enhidWlxaHJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2MDg0MSwiZXhwIjoyMDkwMDM2ODQxfQ.t8psNFiplxWtLDUV24i3SxTrfE49W2RM66jD5lHR5uI'
)

async function test() {
  console.log('Testing RPC get_admin_dashboard_stats...')
  const { data, error } = await supabase.rpc('get_admin_dashboard_stats')
  if (error) {
    console.error('RPC Error:', error.message)
    if (error.message.includes('does not exist')) {
      console.log('RESULT: MIGRATION_NOT_APPLIED')
    } else {
      console.log('RESULT: ERROR', error)
    }
  } else {
    console.log('RPC Success:', data)
    console.log('RESULT: SUCCESS')
  }
}

test()
