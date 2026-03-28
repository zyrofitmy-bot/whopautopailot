import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://rfmrqdlizotzxbuiqhrx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXJxZGxpem90enhidWlxaHJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2MDg0MSwiZXhwIjoyMDkwMDM2ODQxfQ.t8psNFiplxWtLDUV24i3SxTrfE49W2RM66jD5lHR5uI'
)

async function test() {
  console.log('Testing SELECT 1 from profiles...')
  const { data, error } = await supabase.from('profiles').select('id').limit(1)
  if (error) {
    console.error('Error:', error.message)
    console.log('RESULT: ERROR', error)
  } else {
    console.log('Success:', data)
    console.log('RESULT: SUCCESS')
  }
}

test()
