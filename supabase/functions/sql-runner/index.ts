import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Client } from "https://deno.land/x/postgres@v0.19.3/mod.ts"

serve(async (req) => {
  // Simple auth to prevent abuse
  const emergencyToken = req.headers.get('x-emergency-token')
  if (emergencyToken !== 'EMERGENCY_FIX_123') {
    return new Response('Unauthorized', { status: 401 })
  }

  const { query } = await req.json()
  
  // Create a PostgreSQL client
  const databaseUrl = Deno.env.get('SUPABASE_DB_URL')
  if (!databaseUrl) {
    return new Response('SUPABASE_DB_URL not found', { status: 500 })
  }

  const client = new Client(databaseUrl)
  
  try {
    await client.connect()
    
    // Execute the raw query
    // Since some statements might be multiple, we use multi-query if possible, 
    // or we just rely on client.queryObject handling multiple statements
    const result = await client.queryObject(query)
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "SQL executed successfully"
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  } finally {
    await client.end()
  }
})
