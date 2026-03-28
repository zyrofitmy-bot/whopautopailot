import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    let isServiceRole = false;
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const token = authHeader.replace('Bearer ', '')
    
    if (token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
      isServiceRole = true;
    } else {
      const { data: { user }, error: verifyError } = await supabase.auth.getUser(token)
      if (verifyError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    const { order_id } = await req.json()

    const { data: order, error: orderError } = await supabase.from('orders').select('*, service:services(*)').eq('id', order_id).single()
    if (orderError || !order) return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    // CRITICAL: Skip direct API call for organic orders
    if (order.is_organic_mode) {
      console.log(`[process-order] Organic order ${order_id} detected, skips direct API call (handled by schedule)`)
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Organic order detected, delivery will follow schedule',
        is_organic: true 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: provider, error: providerError } = await supabase.from('providers').select('*').eq('id', order.service?.provider_id).single()
    
    if (providerError || !provider) return new Response(JSON.stringify({ error: 'Provider not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const quantityToSend = order.quantity
    const formData = new URLSearchParams()
    formData.append('key', provider.api_key)
    formData.append('action', 'add')
    formData.append('service', order.service?.provider_service_id || '')
    formData.append('link', order.link)
    formData.append('quantity', quantityToSend.toString())

    const response = await fetch(provider.api_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    })

    const responseText = await response.text()
    let result
    try { result = JSON.parse(responseText) } catch { result = { error: responseText } }

    if (result.error) {
      const errorMsg = typeof result.error === 'string' ? result.error : JSON.stringify(result.error)
      await supabase.from('orders').update({ status: 'failed', error_message: errorMsg }).eq('id', order_id)
      return new Response(JSON.stringify({ success: false, error: errorMsg }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const providerOrderId = result.order?.toString() || result.id?.toString() || 'unknown'

    await supabase.from('orders').update({ status: 'processing', provider_order_id: providerOrderId, error_message: null }).eq('id', order_id)

    return new Response(JSON.stringify({ success: true, provider_order_id: providerOrderId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
