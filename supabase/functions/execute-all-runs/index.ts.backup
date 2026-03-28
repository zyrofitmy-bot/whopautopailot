import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Maximum retry attempts for provider API calls
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

// Retry is now UNLIMITED for recoverable errors (active order, balance, etc.)
// Runs keep retrying every cron cycle until a panel becomes free
// Only truly permanent errors (platform mismatch, service not found after 50 tries) stop retries
const MAX_RUN_RETRIES = 9999

// Errors that should NOT mark run as failed - keep as pending for next cron
const TEMPORARY_ERRORS = [
  'balance',
  'not have enough',
  'processing another transaction',
  'active order with this link',
  'wait until order being completed',
  'rate limit',
  'timeout',
  'temporarily',
  'too many requests',
]

// Errors that should try NEXT account (the key might work on another account)
// "Invalid API key" means THIS account's key is wrong, but OTHER accounts might have valid keys!
const ACCOUNT_SPECIFIC_ERRORS = [
  'invalid api key',
  'api key not found',
  'invalid key',
  'unauthorized',
  'authentication failed',
  'wrong api key',
  'api key invalid',
]

// Errors where a DIFFERENT provider might succeed (different min qty, different service config)
// These are NOT permanent — another provider may have different limits
const TRY_NEXT_PROVIDER_ERRORS = [
  'quantity less than minimal',
  'quantity less than minimum',
  'min quantity',
  'minimum order',
  'minimum quantity',
  'max quantity',
  'maximum quantity',
  'quantity more than maximum',
  'service not found',
  'incorrect service',
  'invalid service',
  'service unavailable',
  'service is not available',
]

// Interface for provider account
interface ProviderAccount {
  id: string
  provider_id: string
  name: string
  api_key: string
  api_url: string
  priority: number
  is_active: boolean
  last_used_at: string | null
}

// Interface for service mapping
interface ServiceMapping {
  id: string
  service_id: string
  provider_account_id: string
  provider_service_id: string
  sort_order: number
  is_active: boolean
  provider_account: ProviderAccount
}

// Module-level client - reused across invocations for connection pooling
const balanceCache = new Map<string, { balance: number; checkedAt: number }>()

// Module-level Supabase client for connection reuse
const supabaseModule = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Check provider account balance before placing order
async function checkProviderBalance(account: ProviderAccount): Promise<{ hasBalance: boolean; balance: number }> {
  // Check cache first (valid for 30 seconds)
  const cached = balanceCache.get(account.id)
  if (cached && Date.now() - cached.checkedAt < 30000) {
    return { hasBalance: cached.balance > 0, balance: cached.balance }
  }

  try {
    const formData = new URLSearchParams()
    formData.append('key', account.api_key)
    formData.append('action', 'balance')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(account.api_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const responseText = await response.text()

    let result
    try {
      result = JSON.parse(responseText)
    } catch {
      console.log(`⚠️ Could not parse balance response from ${account.name}: ${responseText}`)
      return { hasBalance: true, balance: -1 } // Assume has balance if can't check
    }

    // Different providers return balance in different formats
    const balance = parseFloat(result.balance || result.funds || result.amount || '0')
    
    // Cache the result
    balanceCache.set(account.id, { balance, checkedAt: Date.now() })
    
    console.log(`💰 ${account.name} balance: ${balance}`)
    return { hasBalance: balance > 0, balance }
  } catch (error) {
    console.log(`⚠️ Balance check failed for ${account.name}: ${error}`)
    return { hasBalance: true, balance: -1 } // Assume has balance if check fails
  }
}

// Get ALL available provider accounts sorted by priority (for multi-account retry)
async function getAllAvailableProviderAccounts(
  supabase: any,
  serviceId: string,
  link: string,
  executionId: string,
  excludeAccountIds: string[] = []
): Promise<{ account: ProviderAccount; providerServiceId: string }[]> {
  console.log(`[${executionId}] Finding ALL available provider accounts for service ${serviceId}`)
  if (excludeAccountIds.length > 0) {
    console.log(`[${executionId}] Excluding accounts: ${excludeAccountIds.join(', ')}`)
  }
  
  // 1. Get all active service-provider mappings ordered by sort_order and last_used_at
  const { data: mappings, error: mappingError } = await supabase
    .from('service_provider_mapping')
    .select(`
      *,
      provider_account:provider_accounts(*)
    `)
    .eq('service_id', serviceId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (mappingError) {
    console.error(`[${executionId}] Error fetching mappings:`, mappingError)
    return []
  }

  if (!mappings || mappings.length === 0) {
    console.log(`[${executionId}] No provider mappings found for service ${serviceId}`)
    return []
  }

  console.log(`[${executionId}] Found ${mappings.length} provider mappings for service`)

  // PRIORITY-FIRST: sort_order decides which account to try first
  // LRU is ONLY used as tiebreaker when multiple accounts have the same priority
  // This ensures YoYo Media 1 (priority 1) is always tried before YoYo Media 3 (priority 3)
  // Even if YoYo Media 1 was recently used for a DIFFERENT service type
  const sortedMappings = [...mappings].sort((a, b) => {
    const aPriority = a.sort_order || 0
    const bPriority = b.sort_order || 0
    // Priority first - lower sort_order = higher priority
    if (aPriority !== bPriority) return aPriority - bPriority
    // Tiebreaker: LRU among same-priority accounts
    const aTime = a.provider_account?.last_used_at ? new Date(a.provider_account.last_used_at).getTime() : 0
    const bTime = b.provider_account?.last_used_at ? new Date(b.provider_account.last_used_at).getTime() : 0
    return aTime - bTime
  })

  const availableAccounts: { account: ProviderAccount; providerServiceId: string }[] = []

  // 2. Build list of available accounts
  // NOTE: We NO LONGER pre-filter based on internal "started" runs!
  // Instead, we let the API decide - if it rejects with "active order", we try next account
  // This is more robust because:
  // 1. Different engagement types (likes vs views) might be allowed on same link
  // 2. Our internal state might be stale (runs auto-completed locally but still active at provider)
  for (const mapping of sortedMappings) {
    const account = mapping.provider_account as ProviderAccount
    
    if (!account || !account.is_active) {
      continue
    }

    // Skip explicitly excluded accounts (already tried and failed in THIS execution)
    if (excludeAccountIds.includes(account.id)) {
      console.log(`[${executionId}] Skipping excluded account: ${account.name}`)
      continue
    }

    // Add to available accounts - let the API call determine actual availability
    availableAccounts.push({
      account,
      providerServiceId: mapping.provider_service_id
    })
  }

  console.log(`[${executionId}] Found ${availableAccounts.length} available accounts`)
  return availableAccounts
}

// Legacy function for backward compatibility - returns first available
async function getAvailableProviderAccount(
  supabase: any,
  serviceId: string,
  link: string,
  executionId: string
): Promise<{ account: ProviderAccount; providerServiceId: string } | null> {
  const accounts = await getAllAvailableProviderAccounts(supabase, serviceId, link, executionId)
  return accounts.length > 0 ? accounts[0] : null
}

// Update last_used_at timestamp for provider account
async function updateAccountLastUsed(supabase: any, accountId: string) {
  await supabase
    .from('provider_accounts')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', accountId)
}

type ProviderStatusCheckResult =
  | { ok: true; data: any; rawText: string }
  | { ok: false; error: string; rawText: string }

async function checkProviderOrderStatusWithRetries(params: {
  apiUrl: string
  apiKey: string
  providerOrderId: string
  maxAttempts?: number
  attemptDelayMs?: number
}): Promise<ProviderStatusCheckResult> {
  const maxAttempts = params.maxAttempts ?? 3
  const attemptDelayMs = params.attemptDelayMs ?? 2000

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const formData = new URLSearchParams()
    formData.append('key', params.apiKey)
    formData.append('action', 'status')
    formData.append('order', params.providerOrderId)

    let rawText = ''
    try {
      const response = await fetch(params.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      })
      rawText = await response.text()

      let result: any
      try {
        result = JSON.parse(rawText)
      } catch {
        result = { error: rawText }
      }

      if (result?.error || result?.status === 'fail') {
        const err = (result?.message || result?.error || 'Provider status error')?.toString()

        // If provider needs a moment to register the order, retry a couple times
        const retryableNotFound =
          err.toLowerCase().includes('not found') ||
          err.toLowerCase().includes('incorrect order') ||
          err.toLowerCase().includes('wrong order')

        if (retryableNotFound && attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, attemptDelayMs))
          continue
        }

        return { ok: false, error: err, rawText }
      }

      return { ok: true, data: result, rawText }
    } catch (e: any) {
      const err = `Network error: ${e?.message || 'Unknown'}`
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, attemptDelayMs))
        continue
      }
      return { ok: false, error: err, rawText }
    }
  }

  return { ok: false, error: 'Unknown provider status error', rawText: '' }
}

// This function is called by a cron job every 5 minutes
// Processes both legacy orders and new engagement orders
// WAIT MODE: Only processes next run when previous run is complete
// ROUND-ROBIN: Rotates between provider accounts to avoid "active order" conflicts
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth check - allow cron (anon key), service key, or authenticated users
    const authHeader = req.headers.get('Authorization')
    
    const supabase = supabaseModule

    // For cron/internal calls with verify_jwt=false in config.toml
    // Accept ANY valid auth - anon key, service key, or user JWT
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      
      // Check if it's a system call (anon or service key)
      const isSystemCall = (anonKey && token === anonKey) || (serviceKey && token === serviceKey)
      
      if (!isSystemCall) {
        // Check if it looks like a JWT (has 3 parts separated by dots)
        const parts = token.split('.')
        if (parts.length === 3) {
          // It's a JWT - try to decode the payload to check if it has 'role' claim
          try {
            const payload = JSON.parse(atob(parts[1]))
            // If it has 'role' of 'anon' or 'service_role', treat as system call
            if (payload.role === 'anon' || payload.role === 'service_role') {
              // System JWT - allow (covers cases where env var doesn't match exactly)
              console.log(`System JWT detected (role: ${payload.role})`)
            } else if (payload.sub) {
              // User JWT - has sub claim, allow
              console.log(`User JWT detected`)
            } else {
              console.log(`Unknown JWT type, rejecting`)
              return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              })
            }
          } catch (e) {
            console.log(`JWT decode failed: ${e}`)
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
              status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }
        } else {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }
    } else if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const now = new Date().toISOString()
    const executionId = crypto.randomUUID().slice(0, 8)
    console.log(`=== EXECUTE ALL ORGANIC RUNS [${executionId}] ===`)
    console.log(`Time: ${now}`)

    let processed = 0
    let skipped = 0
    let failed = 0
    let retried = 0
    const results: any[] = []

    // ============================================
    // STEP 0: GLOBAL CLEANUP - Auto-complete stuck "started" runs (10+ min old)
    // This prevents provider accounts from being permanently blocked
    // ============================================
    console.log(`\n--- Global Stuck Run Cleanup ---`)
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { data: globalStuckRuns } = await supabase
      .from('organic_run_schedule')
      .select('id, run_number, started_at, provider_account_id, provider_status')
      .eq('status', 'started')
      .lt('started_at', tenMinAgo)
    
    if (globalStuckRuns && globalStuckRuns.length > 0) {
      console.log(`🧹 Found ${globalStuckRuns.length} globally stuck runs (started > 10min ago), auto-completing...`)
      for (const stuck of globalStuckRuns) {
        const ageMin = Math.round((Date.now() - new Date(stuck.started_at).getTime()) / 60000)
        console.log(`  🔄 Auto-completing run #${stuck.run_number} (age: ${ageMin}min, status: ${stuck.provider_status || 'unknown'})`)
        await supabase.from('organic_run_schedule').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          error_message: `Auto-completed after ${ageMin}min (global cleanup, status: ${stuck.provider_status || 'unknown'})`,
        }).eq('id', stuck.id)
      }
      console.log(`✅ Cleaned up ${globalStuckRuns.length} stuck runs`)
    } else {
      console.log(`✅ No stuck runs found`)
    }

    // ============================================
    // STEP 1: Process ENGAGEMENT ORDER runs (pending + retry failed)
    // ============================================
    console.log(`\n--- Processing Engagement Order Runs ---`)
    
    // Get pending runs for engagement order items that are due
    // Only fetch runs whose scheduled_at <= now (respects time-based scheduling)
    // After resume from pause, only future-scheduled runs remain pending
    // IMPORTANT: Only fetch 'pending' status - cancelled runs are NEVER processed
    const { data: pendingEngagementRuns, error: engagementRunsError } = await supabase
      .from('organic_run_schedule')
      .select(`
        *,
        engagement_order_item:engagement_order_items(
          *,
          service:services(*),
          engagement_order:engagement_orders(*)
        )
      `)
      .eq('status', 'pending')
      .not('engagement_order_item_id', 'is', null)
      .lte('scheduled_at', now)
      .order('run_number', { ascending: true })
      .limit(50)

    if (engagementRunsError) {
      console.error('Error fetching engagement runs:', engagementRunsError)
    }

    // PRE-FILTER: Remove runs belonging to paused/cancelled orders BEFORE deduplication
    // This prevents paused orders from consuming processing slots
    const activeEngagementRuns = (pendingEngagementRuns || []).filter(run => {
      const orderStatus = run.engagement_order_item?.engagement_order?.status
      const itemStatus = run.engagement_order_item?.status
      if (orderStatus === 'paused' || orderStatus === 'cancelled') return false
      if (itemStatus === 'paused' || itemStatus === 'cancelled') return false
      return true
    })

    console.log(`Fetched ${pendingEngagementRuns?.length || 0} pending runs, ${activeEngagementRuns.length} active (excluded ${(pendingEngagementRuns?.length || 0) - activeEngagementRuns.length} paused/cancelled)`)

    // SEQUENTIAL EXECUTION PER ITEM:
    // Only process ONE run per item at a time to ensure strict priority-based delivery
    // and avoid "active order" conflicts on the same link across different providers.
    const itemRunCount = new Map<string, number>()
    const MAX_CONCURRENT_PER_ITEM = 1 // Strict sequential delivery - one run per item per cycle
    
    const deduplicatedRuns = activeEngagementRuns.filter(run => {
      const itemId = run.engagement_order_item_id
      const count = itemRunCount.get(itemId) || 0
      
      if (count < MAX_CONCURRENT_PER_ITEM) {
        itemRunCount.set(itemId, count + 1)
        return true
      }
      
      return false
    })

    console.log(`Found ${pendingEngagementRuns?.length || 0} pending runs, selected ${deduplicatedRuns.length} for processing`)

    // Also get failed runs that should be retried
    // UNLIMITED RETRY: Failed runs keep retrying every cron cycle until they succeed
    // Only runs with retry_count=99 (platform mismatch) are excluded
    const { data: failedEngagementRuns } = await supabase
      .from('organic_run_schedule')
      .select(`
        *,
        engagement_order_item:engagement_order_items(
          *,
          service:services(*),
          engagement_order:engagement_orders(*)
        )
      `)
      .eq('status', 'failed')
      .lt('retry_count', 99)  // Only skip permanently blocked runs (retry_count=99)
      .not('engagement_order_item_id', 'is', null)
      .order('completed_at', { ascending: true })
      .limit(50)

    // PRE-FILTER failed runs: Remove runs belonging to cancelled/paused orders
    const activeFailedRuns = (failedEngagementRuns || []).filter(run => {
      const orderStatus = run.engagement_order_item?.engagement_order?.status
      const itemStatus = run.engagement_order_item?.status
      if (orderStatus === 'cancelled' || orderStatus === 'paused') return false
      if (itemStatus === 'cancelled' || itemStatus === 'paused') return false
      return true
    })

    // Combine pending and ACTIVE failed runs for retry
    const allEngagementRuns = [...deduplicatedRuns, ...activeFailedRuns]

    console.log(`Processing ${allEngagementRuns.length} runs (${deduplicatedRuns.length} pending + ${activeFailedRuns.length} retry, excluded ${(failedEngagementRuns?.length || 0) - activeFailedRuns.length} cancelled/paused)`)

    // Helper: Detect platform from link
    const detectPlatformFromLink = (url: string): string | null => {
      const lower = url.toLowerCase()
      if (lower.includes('instagram.com') || lower.includes('instagr.am')) return 'instagram'
      if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube'
      if (lower.includes('tiktok.com')) return 'tiktok'
      if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter'
      if (lower.includes('facebook.com') || lower.includes('fb.com')) return 'facebook'
      return null
    }

    // Helper: Detect platform from service name
    const detectPlatformFromService = (serviceName: string): string | null => {
      const lower = serviceName.toLowerCase()
      if (lower.includes('instagram') || lower.includes('ig ')) return 'instagram'
      if (lower.includes('youtube') || lower.includes('yt ')) return 'youtube'
      if (lower.includes('tiktok') || lower.includes('tt ')) return 'tiktok'
      if (lower.includes('twitter') || lower.includes('x ')) return 'twitter'
      if (lower.includes('facebook') || lower.includes('fb ')) return 'facebook'
      return null
    }

    // Process each engagement run (pending + retry)
    for (const run of allEngagementRuns) {
      const isRetry = run.status === 'failed'
      if (isRetry) {
        console.log(`🔄 RETRYING failed run #${run.run_number} (attempt ${(run.retry_count || 0) + 1}/3)`)
      }
      const item = run.engagement_order_item
      if (!item) {
        console.log(`Run ${run.id} missing engagement_order_item, skipping`)
        await supabase.from('organic_run_schedule').update({
          status: 'failed',
          error_message: 'Missing engagement order item',
        }).eq('id', run.id)
        failed++
        continue
      }

      // SKIP PAUSED/CANCELLED ORDERS: Check if parent engagement order OR item is paused/cancelled
      const engagementOrderStatus = item.engagement_order?.status
      const itemStatus = item.status
      
      // 🚫 CANCELLED = PERMANENT BLOCK - Mark all pending runs as cancelled too
      if (engagementOrderStatus === 'cancelled') {
        console.log(`🚫 CANCELLING Run #${run.run_number} - engagement order is cancelled`)
        await supabase.from('organic_run_schedule').update({
          status: 'cancelled',
          error_message: 'Order cancelled by user',
          completed_at: new Date().toISOString(),
        }).eq('id', run.id)
        skipped++
        continue
      }
      
      // Item-level cancellation - also permanent
      if (itemStatus === 'cancelled') {
        console.log(`🚫 CANCELLING Run #${run.run_number} - engagement order ITEM is cancelled`)
        await supabase.from('organic_run_schedule').update({
          status: 'cancelled',
          error_message: 'Item cancelled by user',
          completed_at: new Date().toISOString(),
        }).eq('id', run.id)
        skipped++
        continue
      }
      
      // ⏸️ PAUSED = TEMPORARY - Just skip, don't modify run status (can resume later)
      if (engagementOrderStatus === 'paused') {
        console.log(`⏸️ Run #${run.run_number} skipped - engagement order is paused (will resume when unpaused)`)
        skipped++
        continue
      }
      
      if (itemStatus === 'paused') {
        console.log(`⏸️ Run #${run.run_number} skipped - engagement order ITEM is paused (will resume when unpaused)`)
        skipped++
        continue
      }

      if (!item.service) {
        // FALLBACK: Try to find service from bundle items
        console.log(`Run ${run.id} missing service, attempting bundle fallback...`)
        const bundleId = item.engagement_order?.bundle_id
        if (bundleId) {
          const { data: bundleItem } = await supabase
            .from('bundle_items')
            .select('service_id, service:services(*)')
            .eq('bundle_id', bundleId)
            .eq('engagement_type', item.engagement_type)
            .not('service_id', 'is', null)
            .limit(1)
            .single()
          
          if (bundleItem?.service) {
            console.log(`✅ Found fallback service from bundle: ${bundleItem.service.name}`)
            item.service = bundleItem.service
            // Update the item's service_id for future runs
            await supabase.from('engagement_order_items')
              .update({ service_id: bundleItem.service_id })
              .eq('id', item.id)
          }
        }
        
        if (!item.service) {
          console.log(`Run ${run.id} service not found even after bundle fallback, reverting to pending for retry`)
          const retryCount = (run.retry_count || 0) + 1
          if (retryCount >= MAX_RUN_RETRIES) {
            await supabase.from('organic_run_schedule').update({
              status: 'failed',
              error_message: `Service not found after ${MAX_RUN_RETRIES} retries`,
              retry_count: 99,
            }).eq('id', run.id)
            failed++
          } else {
            // Revert to pending so it gets picked up next cycle (service might be re-added)
            await supabase.from('organic_run_schedule').update({
              status: 'failed',
              error_message: 'Service not found - will retry',
              retry_count: retryCount,
            }).eq('id', run.id)
            skipped++
          }
          continue
        }
      }

      // 🚫 CRITICAL: Platform mismatch detection - BLOCK wrong platform orders
      const orderLink = item.engagement_order?.link || ''
      const linkPlatform = detectPlatformFromLink(orderLink)
      const servicePlatform = detectPlatformFromService(item.service.name || '')
      
      if (linkPlatform && servicePlatform && linkPlatform !== servicePlatform) {
        console.error(`❌ PLATFORM MISMATCH BLOCKED: Link is ${linkPlatform} but service is ${servicePlatform}`)
        console.error(`   Link: ${orderLink}`)
        console.error(`   Service: ${item.service.name}`)
        await supabase.from('organic_run_schedule').update({
          status: 'failed',
          error_message: `BLOCKED: Platform mismatch - ${linkPlatform} link cannot use ${servicePlatform} service`,
          completed_at: new Date().toISOString(),
          retry_count: 99, // Prevent auto-retry
        }).eq('id', run.id)
        failed++
        results.push({ 
          run_id: run.id, 
          type: item.engagement_type, 
          run_number: run.run_number, 
          success: false, 
          error: `Platform mismatch: ${linkPlatform} ≠ ${servicePlatform}` 
        })
        continue
      }

      // Check if THIS run is overdue (5+ min) - if so, bypass normal wait logic
      // Reduced from 30 min to 5 min for faster queue flow
      const runScheduledAt = new Date(run.scheduled_at)
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
      const isThisRunOverdue = runScheduledAt < fiveMinAgo

      // SMART WAIT MODE: Prevent duplicate orders for SAME SERVICE ID on same panel.
      // Different services (e.g., TikTok views vs Instagram views) CAN go to same panel simultaneously.
      // Only the EXACT SAME service_id on the same link is blocked.
      //
      // Example: Panel A has TikTok views running → Instagram views CAN go to Panel A ✅
      //          Panel A has TikTok views running → more TikTok views on same link CANNOT go to Panel A ❌
      
      const sameLink = orderLink.toLowerCase().replace(/\/$/, '')
      const currentServiceId = item.service?.id // The actual service UUID
      
      // 1. Check STARTED runs for same link + same service_id
      const { data: startedRuns } = await supabase
        .from('organic_run_schedule')
        .select(`
          id, run_number, provider_status, started_at, provider_account_id, provider_order_id,
          engagement_order_item:engagement_order_items(
            engagement_type,
            service_id,
            engagement_order:engagement_orders(link)
          )
        `)
        .eq('status', 'started')
        .not('provider_account_id', 'is', null)
      
      // Filter to runs matching SAME link AND SAME service_id only
      const startedRunsForLinkAndType = (startedRuns || []).filter(r => {
        const runLink = (r.engagement_order_item?.engagement_order?.link || '').toLowerCase().replace(/\/$/, '')
        const runServiceId = r.engagement_order_item?.service_id || ''
        return runLink === sameLink && runServiceId === currentServiceId
      })
      
      // 2. Check COMPLETED runs where provider_status is STILL ACTIVE (non-terminal)
      // LIVE CHECK: For each such run, verify with provider API if still active
      // If provider says terminal, update our DB and FREE the account
      const nonTerminalStatuses = ['Pending', 'In progress', 'Processing', 'Partial']
      const { data: providerActiveRuns } = await supabase
        .from('organic_run_schedule')
        .select(`
          id, run_number, provider_account_id, provider_order_id, completed_at, provider_status,
          engagement_order_item:engagement_order_items(
            engagement_type,
            service_id,
            engagement_order:engagement_orders(link)
          )
        `)
        .eq('status', 'completed')
        .not('provider_account_id', 'is', null)
        .not('provider_order_id', 'is', null)
        .in('provider_status', nonTerminalStatuses)
      
      // Filter to same link + same service_id
      const providerActiveForLinkAndType = (providerActiveRuns || []).filter(r => {
        const runLink = (r.engagement_order_item?.engagement_order?.link || '').toLowerCase().replace(/\/$/, '')
        const runServiceId = r.engagement_order_item?.service_id || ''
        return runLink === sameLink && runServiceId === currentServiceId
      })

      // Track which provider accounts are busy for THIS service type on THIS link
      const busyAccountIds: string[] = []
      
      // LIVE VERIFY: For each potentially blocking run, check provider API for fresh status
      for (const activeRun of providerActiveForLinkAndType) {
        if (!activeRun.provider_account_id || busyAccountIds.includes(activeRun.provider_account_id)) continue
        
        // Get provider account details for live check
        const { data: provAccount } = await supabase
          .from('provider_accounts')
          .select('api_key, api_url, name')
          .eq('id', activeRun.provider_account_id)
          .single()
        
        if (provAccount && activeRun.provider_order_id) {
          // LIVE CHECK provider status
          const liveResult = await checkProviderOrderStatusWithRetries({
            apiUrl: provAccount.api_url,
            apiKey: provAccount.api_key,
            providerOrderId: activeRun.provider_order_id,
            maxAttempts: 1,
            attemptDelayMs: 0,
          })
          
          const terminalStatuses = ['Completed', 'Partial', 'Refunded', 'Canceled', 'Cancelled', 'Error', 'Failed']
          
          if (liveResult.ok) {
            const liveStatus = liveResult.data?.status || ''
            // Update our DB with fresh status
            await supabase.from('organic_run_schedule').update({
              provider_status: liveStatus,
              last_status_check: new Date().toISOString(),
            }).eq('id', activeRun.id)
            
            if (terminalStatuses.includes(liveStatus)) {
              console.log(`✅ Live check: Run #${activeRun.run_number} on ${provAccount.name} is NOW ${liveStatus} — account FREED`)
              continue // Don't block this account
            } else {
              console.log(`🔴 Live check: Run #${activeRun.run_number} on ${provAccount.name} still ${liveStatus} — blocking`)
              busyAccountIds.push(activeRun.provider_account_id)
            }
          } else {
            // If live check fails, err on the side of caution — block
            console.log(`⚠️ Live check failed for run #${activeRun.run_number} on ${provAccount.name}: ${liveResult.error} — blocking to be safe`)
            busyAccountIds.push(activeRun.provider_account_id)
          }
        } else {
          busyAccountIds.push(activeRun.provider_account_id)
          console.log(`🔴 Account ${activeRun.provider_account_id} has non-terminal provider order — blocking same link`)
        }
      }
      
      if (startedRunsForLinkAndType && startedRunsForLinkAndType.length > 0) {
        for (const stuckRun of startedRunsForLinkAndType) {
          const terminalStatuses = ['Completed', 'Partial', 'Refunded', 'Canceled', 'Cancelled', 'Error', 'Failed']
          const isTerminal = stuckRun.provider_status && terminalStatuses.includes(stuckRun.provider_status)
          
          const startedAt = new Date(stuckRun.started_at || 0)
          const ageMinutes = Math.round((Date.now() - startedAt.getTime()) / 60000)
          
          // Auto-complete runs with terminal status from provider
          if (isTerminal) {
            console.log(`🔄 Auto-completing run #${stuckRun.run_number} (terminal status: ${stuckRun.provider_status}, age: ${ageMinutes}min)`)
            await supabase.from('organic_run_schedule').update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              error_message: `Auto-completed (status: ${stuckRun.provider_status})`,
            }).eq('id', stuckRun.id)
            // Terminal status = provider is DONE with this order = account is FREE
            // Do NOT add to busy list — the provider has no active order anymore
            console.log(`✅ Account ${stuckRun.provider_account_id} freed — provider status is terminal (${stuckRun.provider_status})`)
          } else if (stuckRun.provider_account_id) {
            const runAge = Math.round((Date.now() - startedAt.getTime()) / 1000)
            
            // GHOST RUN CHECK: If "started" but NO provider_order_id for 60+ seconds,
            // the order was never actually placed (API call failed silently)
            if (!stuckRun.provider_order_id && runAge > 60) {
              console.log(`👻 Ghost run #${stuckRun.run_number} (started ${runAge}s ago but no provider order) — reverting to pending`)
              await supabase.from('organic_run_schedule').update({
                status: 'pending',
                started_at: null,
                provider_account_id: null,
                error_message: `Ghost run reverted (no provider order after ${runAge}s)`,
              }).eq('id', stuckRun.id)
              // Account is NOT busy - order was never placed
              continue
            }
            
            // If started recently (< 60s) without provider_order_id, API call is likely in progress
            if (!stuckRun.provider_order_id && runAge <= 60) {
              console.log(`⏳ Run #${stuckRun.run_number} started ${runAge}s ago, API call in progress — waiting...`)
              if (!busyAccountIds.includes(stuckRun.provider_account_id)) {
                busyAccountIds.push(stuckRun.provider_account_id)
              }
              continue
            }
            
            // INSTANT SKIP: Account is busy with a real order — add to busy list
            if (!busyAccountIds.includes(stuckRun.provider_account_id)) {
              busyAccountIds.push(stuckRun.provider_account_id)
            }
            console.log(`⚡ Account ${stuckRun.provider_account_id} busy with run #${stuckRun.run_number} (${runAge}s) — instantly skipping to other providers`)
            
            // Auto-complete if stuck for 10+ minutes (safety net)
            if (ageMinutes >= 10) {
              console.log(`🔄 Auto-completing stuck run #${stuckRun.run_number} after ${ageMinutes}min`)
              await supabase.from('organic_run_schedule').update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                error_message: `Auto-completed after ${ageMinutes}min (status: ${stuckRun.provider_status || 'unknown'})`,
              }).eq('id', stuckRun.id)
              // DON'T remove from busy — provider still has the order active!
            }
          }
        }
      }
      
      // Log busy accounts
      if (busyAccountIds.length > 0) {
        console.log(`⚠️ ${busyAccountIds.length} accounts busy for ${item.engagement_type} (service ${currentServiceId}) on this link — will EXCLUDE and try next priority provider`)
      }

      // ============================================
      // PRIORITY-BASED PROVIDER SELECTION WITH FAILOVER
      // Try providers strictly in priority order (sort_order ASC).
      // If provider #1 is busy or has no balance → fallback to provider #2, etc.
      // ============================================
      
      // Get available provider accounts EXCLUDING busy ones, sorted by priority
      const availableAccounts = await getAllAvailableProviderAccounts(
        supabase,
        item.service.id,
        orderLink,
        executionId,
        busyAccountIds // Exclude accounts that are busy with same service/link
      )
      
      // Also get default provider as final fallback
      // BUT ONLY if it has a valid UUID id (text provider IDs like "yoyomedia.in" crash on UUID columns)
      let defaultProvider: ProviderAccount | null = null
      const isValidUUID = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
      
      if (item.service.provider_id && isValidUUID(item.service.provider_id)) {
        const { data: provider } = await supabase
          .from('providers')
          .select('*')
          .eq('id', item.service.provider_id)
          .single()
        
        if (provider && isValidUUID(provider.id)) {
          defaultProvider = {
            id: provider.id,
            provider_id: provider.id,
            name: provider.name,
            api_key: provider.api_key,
            api_url: provider.api_url,
            priority: 999,
            is_active: provider.is_active,
            last_used_at: null
          }
        }
      } else if (item.service.provider_id) {
        console.log(`⚠️ Skipping default provider fallback: "${item.service.provider_id}" is not a valid UUID`)
      }
      
      // Build list - priority rotation, any available account
      const accountsToTry: { account: ProviderAccount; providerServiceId: string }[] = [...availableAccounts]
      
      // Add default provider if not already in the list
      if (defaultProvider && !accountsToTry.some(a => a.account.id === defaultProvider!.id)) {
        accountsToTry.push({
          account: defaultProvider,
          providerServiceId: item.service.provider_service_id
        })
      }
      
      if (accountsToTry.length === 0) {
        // Check if accounts EXIST but are all busy vs truly not configured
        const { data: totalMappings } = await supabase
          .from('service_provider_mapping')
          .select('id')
          .eq('service_id', item.service.id)
          .eq('is_active', true)
          .limit(1)
        
        if (totalMappings && totalMappings.length > 0) {
          // Accounts exist but all busy — revert to pending for retry next cycle
          console.log(`⏳ All provider accounts busy for ${item.engagement_type} — keeping as pending for retry`)
          skipped++
        } else {
          // Truly no accounts configured — fail permanently
          console.error(`No provider accounts configured for service ${item.service.id}`)
          await supabase.from('organic_run_schedule').update({
            status: 'failed',
            error_message: 'No provider accounts configured',
          }).eq('id', run.id)
          failed++
        }
        continue
      }
      
      console.log(`🔄 PRIORITY FAILOVER: Will try ${accountsToTry.length} accounts in order: ${accountsToTry.map((a, i) => `${i+1}. ${a.account.name}`).join(' → ')}`)

      // ============================================
      // SMART MINIMUM QUANTITY HANDLING
      // DEPRECATED AGGRESSIVE MERGE: We no longer merge runs here!
      // process-engagement-order ALREADY ensures quantities meet providerMin.
      // If a provider rejects this because their min changed, we let it FAIL OVER
      // to the next provider automatically! Merging destroys the organic spread.
      // ============================================
      let quantityToSend = run.quantity_to_send
      const serviceMinQty = item.service.min_quantity || 10
      
      if (quantityToSend < serviceMinQty) {
        // We only bump the very last run slightly if it's naturally small,
        // otherwise we let the API handle the rejection and failover normally.
        console.log(`⚠️ Quantity ${quantityToSend} below service fallback minimum ${serviceMinQty} for ${item.engagement_type} — checking if bump needed...`)
        
        const { data: remainingRuns } = await supabase
          .from('organic_run_schedule')
          .select('id')
          .eq('engagement_order_item_id', run.engagement_order_item_id)
          .eq('status', 'pending')
          .neq('id', run.id)
          .limit(1)
          
        if (!remainingRuns || remainingRuns.length === 0) {
           console.log(`  📍 Last run for this item — bumping ${quantityToSend} to minimum ${serviceMinQty} to ensure completion`)
           quantityToSend = Math.max(quantityToSend, serviceMinQty)
           // Update the run's quantity
           await supabase.from('organic_run_schedule')
             .update({ quantity_to_send: quantityToSend })
             .eq('id', run.id)
        }
      }
      
      // ALSO check per-provider minimum: the mapped provider service might have a different min
      // than our base service. If provider rejects, TRY_NEXT_PROVIDER_ERRORS handles fallback.

      // Try each account until one succeeds
      let success = false
      let lastError: string | null = null
      let providerOrderId: string | null = null
      let providerResult: any = null
      let successAccount: ProviderAccount | null = null

      // Verified provider status snapshot (to avoid "fake placed" state)
      let verifiedStatus: string | null = null
      let verifiedRemains: number | null = null
      let verifiedStartCount: number | null = null
      let verifiedCharge: number | null = null
      let verifiedLastStatusCheck: string | null = null
      
      for (const { account: selectedAccount, providerServiceId } of accountsToTry) {
        console.log(`\n📤 Trying account: ${selectedAccount.name} (service ID: ${providerServiceId})`)
        
        // PRE-CHECK 0: Re-verify order/item is NOT cancelled before sending to provider
        // This prevents a race condition where admin cancels between run claim and API call
        {
          const { data: freshItem } = await supabase
            .from('engagement_order_items')
            .select('status, engagement_order:engagement_orders(status)')
            .eq('id', item.id)
            .single()
          
          const freshOrderStatus = (freshItem as any)?.engagement_order?.status
          const freshItemStatus = freshItem?.status
          
          if (freshOrderStatus === 'cancelled' || freshItemStatus === 'cancelled') {
            console.log(`🚫 ABORT: Order/item cancelled while preparing run #${run.run_number} — reverting to cancelled`)
            await supabase.from('organic_run_schedule').update({
              status: 'cancelled',
              error_message: 'Cancelled before provider send',
              completed_at: new Date().toISOString(),
            }).eq('id', run.id)
            skipped++
            break // Exit account loop
          }
        }

        // PRE-CHECK: Verify provider has sufficient balance BEFORE placing order
        const { hasBalance, balance: providerBalance } = await checkProviderBalance(selectedAccount)
        if (!hasBalance) {
          console.log(`💸 ${selectedAccount.name} has NO balance (${providerBalance}), skipping to next provider...`)
          lastError = `Provider ${selectedAccount.name} has no balance`
          continue // Try next provider immediately
        }
        
        // Estimate if balance is likely sufficient (rough check: $0.001 per unit minimum)
        // Most SMM services cost between $0.001 - $0.05 per unit
        const estimatedCost = quantityToSend * 0.0001 // Very conservative estimate
        if (providerBalance >= 0 && providerBalance < estimatedCost) {
          console.log(`💸 ${selectedAccount.name} balance (${providerBalance}) likely too low for ${quantityToSend} units, skipping...`)
          lastError = `Provider ${selectedAccount.name} balance too low (${providerBalance})`
          continue
        }
        
        // ATOMIC LOCKING: Only ONE invocation can claim this run.
        // Use strict status check — only 'pending' (or 'failed' for retries) can be claimed.
        // If another invocation already set it to 'started', this update will match 0 rows.
        const currentStatus = isRetry ? 'failed' : 'pending'
        const { error: updateError, count: lockCount } = await supabase
          .from('organic_run_schedule')
          .update({
            status: 'started',
            started_at: new Date().toISOString(),
            error_message: `Trying ${selectedAccount.name}...`,
            retry_count: (run.retry_count || 0) + (isRetry ? 1 : 0),
            provider_order_id: null,
            provider_status: null,
            provider_response: null,
            provider_account_id: selectedAccount.id,
            provider_account_name: selectedAccount.name,
          })
          .eq('id', run.id)
          .eq('status', currentStatus) // STRICT: only claim if still in expected status

        if (updateError) {
          console.error(`Error updating run status:`, updateError)
          continue
        }

        // RACE CONDITION GUARD: If count is 0, another invocation already claimed this run
        if (lockCount === 0) {
          console.log(`🔒 Run #${run.run_number} already claimed by another invocation, skipping`)
          break // Exit account loop — run is being handled elsewhere
        }

        // Update last_used_at for the account
        await updateAccountLastUsed(supabase, selectedAccount.id)

        // Send to provider
        console.log(`Sending Run #${run.run_number}: ${quantityToSend} ${item.engagement_type} to ${selectedAccount.name}`)

        try {
          const formData = new URLSearchParams()
          formData.append('key', selectedAccount.api_key)
          formData.append('action', 'add')
          formData.append('service', providerServiceId)
          formData.append('link', item.engagement_order.link)
          formData.append('quantity', quantityToSend.toString())

          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 30000)

          const response = await fetch(selectedAccount.api_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString(),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)
          const responseText = await response.text()
          console.log(`Provider response from ${selectedAccount.name}: ${responseText}`)

          let result
          try {
            result = JSON.parse(responseText)
          } catch {
            result = { error: responseText }
          }

          // Check for fail status
          if (result.status === 'fail' || result.error) {
            lastError = result.message || result.error
            if (lastError === null || lastError === undefined) lastError = 'Unknown provider error'
            if (typeof lastError !== 'string') lastError = JSON.stringify(lastError)
            console.error(`Account ${selectedAccount.name} failed:`, lastError)
            providerResult = result
            
            // Check if this is an "active order" error - try next account immediately
            const isActiveOrderError = lastError.toLowerCase().includes('active order') || 
                                       lastError.toLowerCase().includes('wait until order')
            
            if (isActiveOrderError) {
              console.log(`⏩ Active order conflict on ${selectedAccount.name}, trying next account...`)
              await new Promise(resolve => setTimeout(resolve, 300)) // Small delay
              continue // Try next account
            }
            
            // For other temporary errors, also try next account
            const isTemporaryError = TEMPORARY_ERRORS.some(err => 
              lastError!.toLowerCase().includes(err.toLowerCase())
            )
            
            if (isTemporaryError) {
              console.log(`⏩ Temporary error on ${selectedAccount.name}, trying next account...`)
              await new Promise(resolve => setTimeout(resolve, 300))
              continue // Try next account
            }
            
            // Check if this is an account-specific error (e.g., invalid API key)
            // This means the ACCOUNT's key is bad, but OTHER accounts might work!
            const isAccountSpecificError = ACCOUNT_SPECIFIC_ERRORS.some(err =>
              lastError!.toLowerCase().includes(err.toLowerCase())
            )
            
            if (isAccountSpecificError) {
              console.log(`🔑 Account-specific error on ${selectedAccount.name}, trying next account...`)
              await new Promise(resolve => setTimeout(resolve, 300))
              continue // Try next account - this account's key is bad, but others might work
            }
            
            // Check if a different provider might handle this (e.g., different min qty limits)
            const isTryNextProviderError = TRY_NEXT_PROVIDER_ERRORS.some(err =>
              lastError!.toLowerCase().includes(err.toLowerCase())
            )
            
            if (isTryNextProviderError) {
              console.log(`🔄 Provider-specific limitation on ${selectedAccount.name} ("${lastError}"), trying next provider...`)
              await new Promise(resolve => setTimeout(resolve, 300))
              continue // Different provider may have different limits
            }
            
            // Non-recoverable error - stop trying
            break
          } else {
            // SUCCESS (but we still VERIFY it exists at provider before claiming it is placed)
            providerOrderId = result.order?.toString() || result.id?.toString() || null

            if (!providerOrderId) {
              lastError = 'Provider returned success but no order id'
              providerResult = result
              console.error(`Account ${selectedAccount.name} returned success without order id`)
              await new Promise(resolve => setTimeout(resolve, 300))
              continue
            }

            console.log(`🧾 Provider returned Order ID ${providerOrderId} — verifying status...`)
            const statusCheck = await checkProviderOrderStatusWithRetries({
              apiUrl: selectedAccount.api_url,
              apiKey: selectedAccount.api_key,
              providerOrderId,
              maxAttempts: 3,
              attemptDelayMs: 1500,
            })

            if (!statusCheck.ok) {
              lastError = `Verification failed: ${statusCheck.error}`
              console.error(`❌ Verification failed on ${selectedAccount.name} for order ${providerOrderId}:`, statusCheck.error)

              providerResult = {
                add: result,
                verify_error: statusCheck.error,
                verify_raw: statusCheck.rawText,
              }

              // Keep a transparent trail in DB (so UI never "lies")
              await supabase.from('organic_run_schedule').update({
                provider_order_id: providerOrderId,
                provider_status: 'Unverified',
                provider_response: providerResult,
                error_message: `Verification pending: ${statusCheck.error}`,
                last_status_check: new Date().toISOString(),
              }).eq('id', run.id)

              await new Promise(resolve => setTimeout(resolve, 300))
              continue // Try next account
            }

            // Verified ✅
            verifiedStatus = statusCheck.data?.status?.toString() || null
            const startCountParsed = parseInt(statusCheck.data?.start_count)
            verifiedStartCount = Number.isFinite(startCountParsed) ? startCountParsed : null
            const remainsParsed = parseInt(statusCheck.data?.remains)
            verifiedRemains = Number.isFinite(remainsParsed) ? remainsParsed : null
            const chargeParsed = parseFloat(statusCheck.data?.charge)
            verifiedCharge = Number.isFinite(chargeParsed) ? chargeParsed : null
            verifiedLastStatusCheck = new Date().toISOString()

            providerResult = { add: result, status: statusCheck.data }
            successAccount = selectedAccount
            success = true
            console.log(
              `✅ Run #${run.run_number} verified via ${selectedAccount.name}! Order ID: ${providerOrderId} (status: ${verifiedStatus || 'unknown'})`
            )
            break // Stop trying more accounts
          }
        } catch (fetchError: any) {
          lastError = 'Network error: ' + (fetchError.message || 'Unknown')
          console.error(`Network error with ${selectedAccount.name}:`, fetchError.message)
          // Try next account
          await new Promise(resolve => setTimeout(resolve, 500))
          continue
        }
      }

      // Update run based on final result
      if (success && providerOrderId && successAccount) {
        // CRITICAL: Re-check if order was cancelled WHILE we were sending to provider
        // If cancelled, do NOT overwrite the cancelled status — just log the provider order for reference
        const { data: freshItemPostSend } = await supabase
          .from('engagement_order_items')
          .select('status, engagement_order:engagement_orders(status)')
          .eq('id', item.id)
          .single()
        
        const postSendOrderStatus = (freshItemPostSend as any)?.engagement_order?.status
        const postSendItemStatus = freshItemPostSend?.status
        
        if (postSendOrderStatus === 'cancelled' || postSendItemStatus === 'cancelled') {
          console.log(`🚫 Order/item cancelled DURING provider send for run #${run.run_number}. Provider order ${providerOrderId} was placed but order is cancelled.`)
          // Save provider order ID for audit trail but keep status as cancelled
          await supabase.from('organic_run_schedule').update({
            status: 'cancelled',
            provider_order_id: providerOrderId,
            provider_response: providerResult,
            provider_account_id: successAccount.id,
            provider_account_name: successAccount.name,
            provider_status: verifiedStatus,
            error_message: `Order cancelled during send — provider order ${providerOrderId} may need manual cancellation`,
            completed_at: new Date().toISOString(),
            last_status_check: new Date().toISOString(),
          }).eq('id', run.id)
          skipped++
          results.push({ 
            run_id: run.id, type: item.engagement_type, run_number: run.run_number,
            success: false, error: 'Order cancelled during provider send',
            provider_order_id: providerOrderId
          })
          continue // Skip to next run — don't update item/order status
        }
        
        // GUARD: Only update if run is still 'started' (not cancelled by admin in the meantime)
        const { count: updateCount } = await supabase.from('organic_run_schedule').update({
          provider_order_id: providerOrderId,
          provider_response: providerResult,
          error_message: null,
          provider_account_id: successAccount.id,
          provider_account_name: successAccount.name,
          provider_status: verifiedStatus,
          provider_start_count: verifiedStartCount,
          provider_remains: verifiedRemains,
          provider_charge: verifiedCharge,
          last_status_check: verifiedLastStatusCheck || new Date().toISOString(),
        }).eq('id', run.id).eq('status', 'started') // Only if still started!
        
        if (updateCount === 0) {
          console.log(`⚠️ Run #${run.run_number} status changed (possibly cancelled) — skipping item/order update`)
          skipped++
          continue
        }

        // Update item status to processing — but ONLY if not already cancelled/paused
        await supabase.from('engagement_order_items').update({
          status: 'processing',
        }).eq('id', item.id).not('status', 'in', '("cancelled","paused")')

        // Update engagement order status to processing — but ONLY if not already cancelled/paused
        await supabase.from('engagement_orders').update({
          status: 'processing',
        }).eq('id', item.engagement_order_id).not('status', 'in', '("cancelled","paused")')

        processed++
        results.push({ 
          run_id: run.id, 
          type: item.engagement_type, 
          run_number: run.run_number,
          success: true, 
          provider_order_id: providerOrderId,
          account_used: successAccount.name,
          accounts_tried: accountsToTry.length
        })
      } else {
        // All accounts failed — ALWAYS revert to pending for auto-retry
        // Only truly permanent errors (platform mismatch) are handled above with retry_count=99
        // Everything else keeps retrying every cron cycle until a panel becomes free
        const retryCount = (run.retry_count || 0) + 1
        console.log(`🔄 All ${accountsToTry.length} accounts failed (attempt #${retryCount}), reverting to pending for auto-retry`)
        await supabase.from('organic_run_schedule').update({
          status: 'pending',
          started_at: null,
          error_message: `[Auto-retry #${retryCount}] All ${accountsToTry.length} accounts busy: ${lastError}`,
          provider_response: providerResult,
          provider_account_id: null,
          retry_count: retryCount,
          last_status_check: new Date().toISOString(),
        }).eq('id', run.id)
        skipped++
        results.push({ 
          run_id: run.id, 
          type: item.engagement_type, 
          run_number: run.run_number, 
          success: false, 
          error: lastError, 
          will_retry: true,
          retry_attempt: retryCount,
          accounts_tried: accountsToTry.length
        })
      }

      // Small delay between runs to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // ============================================
    // STEP 2: Process LEGACY ORDER runs (order_id based)
    // ============================================
    console.log(`\n--- Processing Legacy Order Runs ---`)
    
    const { data: legacyRuns } = await supabase
      .from('organic_run_schedule')
      .select(`
        *,
        order:orders(*, service:services(*))
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .not('order_id', 'is', null)
      .is('engagement_order_item_id', null)
      .order('scheduled_at', { ascending: true })
      .limit(10)

    console.log(`Found ${legacyRuns?.length || 0} pending legacy runs`)

    for (const run of legacyRuns || []) {
      const order = run.order
      if (!order || !order.service) {
        console.log(`Legacy run ${run.id} missing order or service, skipping`)
        continue
      }

      // 🚫 CANCELLED = PERMANENT BLOCK - Mark run as cancelled too
      if (order.status === 'cancelled') {
        console.log(`🚫 CANCELLING Legacy run #${run.run_number} - order is cancelled`)
        await supabase.from('organic_run_schedule').update({
          status: 'cancelled',
          error_message: 'Order cancelled by user',
          completed_at: new Date().toISOString(),
        }).eq('id', run.id)
        skipped++
        continue
      }
      
      // ⏸️ PAUSED = TEMPORARY - Just skip, can resume later
      if (order.status === 'paused') {
        console.log(`⏸️ Legacy run #${run.run_number} skipped - order is paused (will resume when unpaused)`)
        skipped++
        continue
      }

      // WAIT MODE: Check for started runs (with stuck run handling - 2 min threshold for fast processing)
      const { data: startedRuns } = await supabase
        .from('organic_run_schedule')
        .select('id, provider_status, started_at, run_number')
        .eq('order_id', order.id)
        .eq('status', 'started')
        .limit(1)

      if (startedRuns && startedRuns.length > 0) {
        const stuckRun = startedRuns[0]
        const terminalStatuses = ['Completed', 'Partial', 'Refunded', 'Canceled', 'Cancelled', 'Error', 'Failed']
        const isTerminal = stuckRun.provider_status && terminalStatuses.includes(stuckRun.provider_status)
        
        const startedAt = new Date(stuckRun.started_at || 0)
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000)
        const isStuckWithoutStatus = startedAt < twoMinutesAgo && !stuckRun.provider_status
        const isInProgressTooLong = startedAt < twoMinutesAgo && stuckRun.provider_status === 'In progress'
        const isPendingTooLong = startedAt < twoMinutesAgo && stuckRun.provider_status === 'Pending'
        
        if (isTerminal || isStuckWithoutStatus || isInProgressTooLong || isPendingTooLong) {
          const ageMinutes = Math.round((Date.now() - startedAt.getTime()) / 60000)
          console.log(`🔄 Auto-unblocking legacy run as completed (age: ${ageMinutes}min)`)
          
          await supabase.from('organic_run_schedule').update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            error_message: `Auto-completed after ${ageMinutes}min (status: ${stuckRun.provider_status || 'unknown'})`,
          }).eq('id', stuckRun.id)
        } else {
          // Only wait if started run is less than 60 seconds old
          const runAge = Math.round((Date.now() - startedAt.getTime()) / 1000)
          if (runAge < 60) {
            console.log(`Legacy order ${order.id} has run #${stuckRun.run_number} in progress (${runAge}s old), waiting...`)
            skipped++
            continue
          } else {
            console.log(`⚡ Legacy run #${stuckRun.run_number} is ${runAge}s old, proceeding with next run`)
          }
        }
      }

      const { data: provider } = await supabase
        .from('providers')
        .select('*')
        .eq('id', order.service.provider_id)
        .single()

      if (!provider) {
        await supabase.from('organic_run_schedule').update({
          status: 'failed',
          error_message: 'Provider not found',
        }).eq('id', run.id)
        failed++
        continue
      }

      // LOCKING
      const { error: updateError } = await supabase
        .from('organic_run_schedule')
        .update({
          status: 'started',
          started_at: new Date().toISOString(),
        })
        .eq('id', run.id)
        .eq('status', 'pending')

      if (updateError) {
        console.log(`Legacy run ${run.id} already being processed, skipping`)
        continue
      }

      // With retry logic
      let lastError: string | null = null
      let providerOrderId: string | null = null

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const formData = new URLSearchParams()
          formData.append('key', provider.api_key)
          formData.append('action', 'add')
          formData.append('service', order.service.provider_service_id)
          formData.append('link', order.link)
          formData.append('quantity', run.quantity_to_send.toString())

          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 30000)

          const response = await fetch(provider.api_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString(),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)
          const result = await response.json().catch(() => ({ error: 'Invalid response' }))

          // Check for fail status or error
          if (result.status === 'fail' || result.error) {
            lastError = result.message || result.error
            if (typeof lastError !== 'string') lastError = JSON.stringify(lastError)
            
            // Check if error is temporary
            const isTemporaryError = TEMPORARY_ERRORS.some(err => 
              lastError!.toLowerCase().includes(err.toLowerCase())
            )
            
            if (isTemporaryError) {
              console.log(`⏸️ Legacy run temporary error - will retry in next cycle`)
              lastError = `TEMP_ERROR: ${lastError}`
              break
            }
            
            if (attempt < MAX_RETRIES) {
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt))
              retried++
              continue
            }
          } else {
            providerOrderId = result.order?.toString() || result.id?.toString()
            break
          }
        } catch (fetchError: any) {
          lastError = 'Network error'
          if (attempt < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt))
            retried++
          }
        }
      }

      if (providerOrderId) {
        await supabase.from('organic_run_schedule').update({
          provider_order_id: providerOrderId,
        }).eq('id', run.id)

        await supabase.from('orders').update({ status: 'processing' }).eq('id', order.id)
        processed++
      } else {
        // Check if temporary error
        const isTemporaryError = lastError?.startsWith('TEMP_ERROR:')
        
        if (isTemporaryError) {
          const cleanError = lastError?.replace('TEMP_ERROR: ', '') || 'Temporary error'
          console.log(`🔄 Reverting legacy run to pending (temporary error)`)
          await supabase.from('organic_run_schedule').update({
            status: 'pending',
            started_at: null,
            error_message: `[Will retry] ${cleanError}`,
          }).eq('id', run.id)
          skipped++
        } else {
          await supabase.from('organic_run_schedule').update({
            status: 'failed',
            error_message: lastError || 'Failed after retries',
          }).eq('id', run.id)
          failed++
        }
      }
    }

    console.log(`\n=== EXECUTION COMPLETE [${executionId}] ===`)
    console.log(`Processed: ${processed}, Skipped (waiting): ${skipped}, Failed: ${failed}, Retried: ${retried}`)

    // Send admin alert if there were failures
    if (failed > 0) {
      try {
        const alertPayload = {
          job_name: 'execute-all-runs',
          execution_id: executionId,
          failed_count: failed,
          processed_count: processed,
          skipped_count: skipped,
          error_details: results.filter(r => !r.success).map(r => ({
            run_id: r.run_id,
            run_number: r.run_number,
            type: r.type,
            error: r.error
          }))
        }

        console.log('Sending failure alert to admins...')
        const alertResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-admin-alert`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
            },
            body: JSON.stringify(alertPayload)
          }
        )
        const alertResult = await alertResponse.json()
        console.log('Alert response:', alertResult)
      } catch (alertError) {
        console.error('Failed to send admin alert:', alertError)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      execution_id: executionId,
      processed,
      skipped,
      failed,
      retried,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Execution error:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
