import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Client } from "https://deno.land/x/postgres@v0.19.3/mod.ts"

const cronSql = `
-- 1. Unschedule old jobs
SELECT cron.unschedule('organic-runs-minutely');
SELECT cron.unschedule('check-order-status-every-2-min');
SELECT cron.unschedule('check-order-status-every-5-min');
SELECT cron.unschedule('sync-service-prices-every-12-hours');

-- 2. Reschedule with CORRECT key (Bearer eyJhbGci...5uI)
SELECT cron.schedule('organic-runs-minutely', '* * * * *', $$ 
  SELECT net.http_post(
    url:='https://rfmrqdlizotzxbuiqhrx.supabase.co/functions/v1/execute-all-runs', 
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXJxZGxpem90enhidWlxaHJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2MDg0MSwiZXhwIjoyMDkwMDM2ODQxfQ.t8psNFiplxWtLDUV24i3SxTrfE49W2RM66jD5lHR5uI", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXJxZGxpem90enhidWlxaHJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2MDg0MSwiZXhwIjoyMDkwMDM2ODQxfQ.t8psNFiplxWtLDUV24i3SxTrfE49W2RM66jD5lHR5uI"}'::jsonb, 
    body:='{}'::jsonb
  ) as request_id; 
$$);

SELECT cron.schedule('check-order-status-every-2-min', '*/2 * * * *', $$ 
  SELECT net.http_post(
    url:='https://rfmrqdlizotzxbuiqhrx.supabase.co/functions/v1/check-order-status', 
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXJxZGxpem90enhidWlxaHJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2MDg0MSwiZXhwIjoyMDkwMDM2ODQxfQ.t8psNFiplxWtLDUV24i3SxTrfE49W2RM66jD5lHR5uI", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXJxZGxpem90enhidWlxaHJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2MDg0MSwiZXhwIjoyMDkwMDM2ODQxfQ.t8psNFiplxWtLDUV24i3SxTrfE49W2RM66jD5lHR5uI"}'::jsonb, 
    body:='{}'::jsonb
  ) as request_id; 
$$);
`;

serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXJxZGxpem90enhidWlxaHJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2MDg0MSwiZXhwIjoyMDkwMDM2ODQxfQ.t8psNFiplxWtLDUV24i3SxTrfE49W2RM66jD5lHR5uI') {
    return new Response('Unauthorized', { status: 401 })
  }

  // Use the session DB URL which is usually available to postgres extension
  const databaseUrl = Deno.env.get('SUPABASE_DB_URL') || "postgres://postgres.rfmrqdlizotzxbuiqhrx:OrganicFlow123!@aws-0-us-west-1.pooler.supabase.com:5432/postgres";
  
  const client = new Client(databaseUrl)
  try {
    await client.connect()
    await client.queryArray(cronSql)
    return new Response(JSON.stringify({ success: true, message: "Cron jobs updated successfully" }), { headers: { "Content-Type": "application/json" } })
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500, headers: { "Content-Type": "application/json" } })
  } finally {
    await client.end()
  }
})
