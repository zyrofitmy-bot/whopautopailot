import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://rfmrqdlizotzxbuiqhrx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXJxZGxpem90enhidWlxaHJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2MDg0MSwiZXhwIjoyMDkwMDM2ODQxfQ.t8psNFiplxWtLDUV24i3SxTrfE49W2RM66jD5lHR5uI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkLatestOrders() {
  const { data: stdOrders } = await supabase
    .from('orders')
    .select('id, order_number, status, error_message, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: provider } = await supabase
    .from('providers')
    .select('id, name, api_url, api_key')
    .limit(1);

  const output = {
    orders: stdOrders,
    provider: provider ? provider.map(p => ({
      ...p,
      api_key: p.api_key ? `${p.api_key.substring(0, 5)}...${p.api_key.substring(p.api_key.length - 4)}` : null
    })) : null
  };

  fs.writeFileSync('diag_output.json', JSON.stringify(output, null, 2));
}

checkLatestOrders();
