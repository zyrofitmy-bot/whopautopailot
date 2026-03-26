import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Module-level client - reused across invocations for connection pooling
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth check - accept user JWT or internal service-role JWT (from public-api)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: authUser }, error: verifyError } = await supabase.auth.getUser(token)

    if (verifyError || !authUser) {
      // If user token fails, check if it's a service role key (for internal calls)
      // For simplicity in this environment, we'll check if the token matches the service role key
      if (token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
        const user = { id: 'system' }
        // Proceed as system (bypass sub check)
      } else {
        console.error('Auth failed:', verifyError?.message)
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    const user = { id: authUser?.id ?? 'system' }
    const isServiceRole = user.id === 'system'

    // Validate active subscription (Required for new orders)
    // First, check if user is admin (admins bypass subscription check)
    if (!isServiceRole) {
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (userRole?.role !== 'admin') {
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .select('id, status, plan_type')
          .eq('user_id', user.id)
          .maybeSingle()

        console.log(`[process-order] Subscription check for ${user.id}:`, JSON.stringify(subscription))
        if (subError) console.error(`[process-order] Subscription fetch error:`, subError.message)

        if (!subscription || subscription.status !== 'active' || subscription.plan_type === 'trial') {
          console.error('User does not have an active subscription')
          return new Response(JSON.stringify({ 
            error: 'Subscription required to place orders. Please select a plan from your dashboard.',
            debug: { userId: user.id, foundSub: subscription }
          }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }
    }

    const { order_id, run_id } = await req.json()

    console.log(`=== PROCESS ORDER START ===`)
    console.log(`Order ID: ${order_id}`)
    console.log(`Run ID: ${run_id || 'direct (no run)'}`)

    if (!order_id) {
      console.error('No order_id provided')
      return new Response(JSON.stringify({ error: 'order_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get order details with service
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, service:services(*)')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      console.error('Order not found:', orderError)
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Order #${order.order_number} found`)
    console.log(`Service: ${order.service?.name}`)
    console.log(`Link: ${order.link}`)
    console.log(`Total Quantity: ${order.quantity}`)
    console.log(`Is Organic: ${order.is_organic_mode}`)

    // Get provider details
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('*')
      .eq('id', order.service?.provider_id)
      .single()

    if (providerError || !provider) {
      console.error('Provider not found:', providerError)
      await supabase.from('orders').update({
        status: 'failed',
        error_message: 'Provider not configured'
      }).eq('id', order_id)

      return new Response(JSON.stringify({ error: 'Provider not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Provider: ${provider.name}`)
    console.log(`API URL: ${provider.api_url}`)

    // Determine quantity to send
    let quantityToSend = order.quantity
    let runData = null

    if (run_id) {
      // This is an organic/drip run - get the specific run
      const { data: run, error: runError } = await supabase
        .from('organic_run_schedule')
        .select('*')
        .eq('id', run_id)
        .single()

      if (runError || !run) {
        console.error('Run not found:', runError)
        return new Response(JSON.stringify({ error: 'Run not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Check if run is already being processed or completed
      if (run.status === 'started' || run.status === 'completed') {
        console.log(`Run ${run_id} already ${run.status}, skipping`)
        return new Response(JSON.stringify({
          success: true,
          message: `Run already ${run.status}`,
          skipped: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      runData = run
      quantityToSend = run.quantity_to_send

      console.log(`Processing Run #${run.run_number}`)
      console.log(`Run Quantity: ${quantityToSend}`)

      // Update run status to started
      await supabase.from('organic_run_schedule').update({
        status: 'started',
        started_at: new Date().toISOString()
      }).eq('id', run_id)
    }

    // Ensure minimum quantity (service minimum, default 10)
    const serviceMinQty = order.service?.min_quantity || 10
    if (quantityToSend < serviceMinQty) {
      console.log(`Quantity ${quantityToSend} below minimum ${serviceMinQty}, adjusting`)
      quantityToSend = serviceMinQty
    }

    console.log(`=== SENDING TO PROVIDER ===`)
    console.log(`Quantity: ${quantityToSend}`)
    console.log(`Service ID: ${order.service?.provider_service_id}`)

    // Send to provider API
    const formData = new URLSearchParams()
    formData.append('key', provider.api_key)
    formData.append('action', 'add')
    formData.append('service', order.service?.provider_service_id || '')
    formData.append('link', order.link)
    formData.append('quantity', quantityToSend.toString())

    console.log(`Request body: ${formData.toString().replace(provider.api_key, '***API_KEY***')}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

    const response = await fetch(provider.api_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const responseText = await response.text()
    console.log(`Provider raw response: ${responseText}`)

    let result
    try {
      result = JSON.parse(responseText)
    } catch {
      console.error('Failed to parse provider response as JSON')
      result = { error: responseText }
    }

    console.log('Provider parsed response:', JSON.stringify(result))

    if (result.error) {
      const errorMsg = typeof result.error === 'string' ? result.error : JSON.stringify(result.error)
      console.error('Provider returned error:', errorMsg)

      if (run_id) {
        await supabase.from('organic_run_schedule').update({
          status: 'failed',
          error_message: errorMsg,
          provider_response: result
        }).eq('id', run_id)
      } else {
        await supabase.from('orders').update({
          status: 'failed',
          error_message: errorMsg
        }).eq('id', order_id)
      }

      return new Response(JSON.stringify({
        success: false,
        error: errorMsg
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Success! Extract provider order ID
    const providerOrderId = result.order?.toString() || result.id?.toString() || 'unknown'
    console.log(`=== SUCCESS ===`)
    console.log(`Provider Order ID: ${providerOrderId}`)

    if (run_id) {
      // WAIT MODE: Keep run as 'started' - will be marked 'completed' by check-order-status cron
      // This ensures we wait for provider to complete before sending next run
      await supabase.from('organic_run_schedule').update({
        provider_order_id: providerOrderId,
        provider_response: result
        // status remains 'started' - check-order-status will update to 'completed'
      }).eq('id', run_id)

      // Update order to processing
      await supabase.from('orders').update({
        status: 'processing'
      }).eq('id', order_id)

      console.log(`Run sent to provider. Waiting for completion check.`)
    } else {
      // Direct order - mark as processing, will be completed by status check
      await supabase.from('orders').update({
        status: 'processing',
        provider_order_id: providerOrderId
      }).eq('id', order_id)
    }

    console.log('=== PROCESS ORDER COMPLETE ===')

    return new Response(JSON.stringify({
      success: true,
      provider_order_id: providerOrderId,
      quantity_sent: quantityToSend
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Process order error:', error)
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
