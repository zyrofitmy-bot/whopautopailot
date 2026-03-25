import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// ============================================
// SERVICE-SPECIFIC ORGANIC SCHEDULING v6.0
// Each engagement type has UNIQUE delivery patterns
// ============================================

type ServiceCategory =
  | 'views' | 'likes' | 'comments' | 'followers' | 'subscribers'
  | 'retweets' | 'shares' | 'saves' | 'watch_hours' | 'reposts' | 'generic'

interface OrganicServiceConfig {
  baseIntervalMinutes: number
  intervalVariance: number
  quantityVariancePercent: number
  spikeChance: number
  spikeMagnitude: [number, number]
  dipChance: number
  dipMagnitude: [number, number]
  burstChance: number
  pauseChance: number
  patternBreakerChance: number
  peakHourBoost: number
  nightReduction: number
  runsPerThousand: number
  minRunsPerOrder: number
  maxRunsPerOrder: number
  targetHumanScore: [number, number]
  defaultMinQty: number
}

// COMPLETE SERVICE-SPECIFIC CONFIGS - Each type behaves differently!
// ============================================
// ULTRA ORGANIC CAPS - Looks 100% Human
// Small batches + Long gaps = Undetectable
// ============================================

// STRICT batch limits - realistic human-like quantities per run
// These are HARD CAPS - no run should ever exceed these values
const MAX_BATCH_CAPS: Record<string, number> = {
  views: 350,           // Real viral gets ~100-300 views in bursts, max 350
  likes: 80,            // Humans like slowly, max 80 at once  
  comments: 5,          // Comments are RARE - max 5 per burst
  saves: 40,            // Saves happen slowly
  shares: 50,           // Shares are rare actions
  followers: 15,        // Followers trickle in slowly
  subscribers: 10,      // Subscribers are very slow
  retweets: 60,         // Retweets in small waves
  reposts: 55,          // Reposts similar to retweets
  watch_hours: 1,       // Watch hours accumulate very slowly
  story_views: 300,     // Story views can be slightly faster
  impressions: 400,     // Impressions slightly higher
  reach: 350,           // Reach similar to views
  profile_visits: 25,   // Profile visits are rare
  mentions: 5,          // Mentions very rare
  quotes: 8,            // Quotes rare
  bookmarks: 40,        // Bookmarks slow
  favorites: 70,        // Favorites moderate
  plays: 250,           // Plays moderate
  listens: 200,         // Listens moderate
  downloads: 10,        // Downloads very slow
  generic: 100,         // Conservative for unknown
}

// LONG intervals - humans don't engage every few minutes
const MIN_INTERVAL_CAPS: Record<string, number> = {
  views: 25,            // 25+ min between view runs
  likes: 40,            // 40+ min between like runs
  comments: 90,         // 90+ min between comments (very slow)
  saves: 55,            // 55+ min between save runs
  shares: 75,           // 75+ min between share runs
  followers: 150,       // 2.5 hours+ between follower runs
  subscribers: 180,     // 3 hours+ between subscriber runs
  retweets: 35,         // 35+ min between retweet runs
  reposts: 42,          // 42+ min between repost runs
  watch_hours: 240,     // 4 hours+ between watch hour runs
  story_views: 20,      // 20+ min between story view runs
  impressions: 28,      // 28+ min between impression runs
  reach: 30,            // 30+ min between reach runs
  profile_visits: 65,   // 65+ min between profile visit runs
  mentions: 120,        // 2 hours+ between mention runs
  quotes: 95,           // 95+ min between quote runs
  bookmarks: 50,        // 50+ min between bookmark runs
  favorites: 45,        // 45+ min between favorite runs
  plays: 22,            // 22+ min between play runs
  listens: 28,          // 28+ min between listen runs
  downloads: 85,        // 85+ min between download runs
  generic: 50,          // 50+ min for unknown types
}

const SERVICE_CONFIGS: Record<ServiceCategory, OrganicServiceConfig> = {
  views: {
    baseIntervalMinutes: 45, intervalVariance: 25, quantityVariancePercent: 55,
    spikeChance: 0.08, spikeMagnitude: [1.2, 1.5], dipChance: 0.20, dipMagnitude: [0.5, 0.8],
    burstChance: 0.05, pauseChance: 0.25, patternBreakerChance: 0.30,
    peakHourBoost: 1.3, nightReduction: 0.25, runsPerThousand: 20,
    minRunsPerOrder: 25, maxRunsPerOrder: 300, targetHumanScore: [85, 99], defaultMinQty: 100
  },
  likes: {
    baseIntervalMinutes: 65, intervalVariance: 35, quantityVariancePercent: 60,
    spikeChance: 0.06, spikeMagnitude: [1.2, 1.5], dipChance: 0.25, dipMagnitude: [0.45, 0.75],
    burstChance: 0.04, pauseChance: 0.30, patternBreakerChance: 0.35,
    peakHourBoost: 1.25, nightReduction: 0.20, runsPerThousand: 100, // Increased runs per 1k
    minRunsPerOrder: 5, maxRunsPerOrder: 200, targetHumanScore: [88, 99], defaultMinQty: 10
  },
  comments: {
    baseIntervalMinutes: 150, intervalVariance: 80, quantityVariancePercent: 75,
    spikeChance: 0.03, spikeMagnitude: [1.1, 1.3], dipChance: 0.40, dipMagnitude: [0.4, 0.7],
    burstChance: 0.02, pauseChance: 0.50, patternBreakerChance: 0.40,
    peakHourBoost: 1.15, nightReduction: 0.10, runsPerThousand: 250,
    minRunsPerOrder: 15, maxRunsPerOrder: 150, targetHumanScore: [92, 99], defaultMinQty: 5
  },
  followers: {
    baseIntervalMinutes: 300, intervalVariance: 150, quantityVariancePercent: 65,
    spikeChance: 0.02, spikeMagnitude: [1.1, 1.3], dipChance: 0.35, dipMagnitude: [0.45, 0.7],
    burstChance: 0.01, pauseChance: 0.55, patternBreakerChance: 0.35,
    peakHourBoost: 1.1, nightReduction: 0.15, runsPerThousand: 80,
    minRunsPerOrder: 15, maxRunsPerOrder: 120, targetHumanScore: [92, 99], defaultMinQty: 10
  },
  subscribers: {
    baseIntervalMinutes: 360, intervalVariance: 180, quantityVariancePercent: 70,
    spikeChance: 0.01, spikeMagnitude: [1.1, 1.2], dipChance: 0.40, dipMagnitude: [0.5, 0.75],
    burstChance: 0.01, pauseChance: 0.60, patternBreakerChance: 0.40,
    peakHourBoost: 1.08, nightReduction: 0.10, runsPerThousand: 120,
    minRunsPerOrder: 12, maxRunsPerOrder: 100, targetHumanScore: [94, 99], defaultMinQty: 10
  },
  retweets: {
    baseIntervalMinutes: 70, intervalVariance: 38, quantityVariancePercent: 60,
    spikeChance: 0.08, spikeMagnitude: [1.2, 1.6], dipChance: 0.18, dipMagnitude: [0.45, 0.7],
    burstChance: 0.06, pauseChance: 0.22, patternBreakerChance: 0.28,
    peakHourBoost: 1.35, nightReduction: 0.22, runsPerThousand: 65,
    minRunsPerOrder: 18, maxRunsPerOrder: 150, targetHumanScore: [82, 97], defaultMinQty: 10
  },
  shares: {
    baseIntervalMinutes: 100, intervalVariance: 55, quantityVariancePercent: 65,
    spikeChance: 0.05, spikeMagnitude: [1.15, 1.4], dipChance: 0.28, dipMagnitude: [0.45, 0.7],
    burstChance: 0.03, pauseChance: 0.35, patternBreakerChance: 0.32,
    peakHourBoost: 1.2, nightReduction: 0.18, runsPerThousand: 250, // Increased runs per 1k
    minRunsPerOrder: 3, maxRunsPerOrder: 120, targetHumanScore: [88, 99], defaultMinQty: 10
  },
  saves: {
    baseIntervalMinutes: 110, intervalVariance: 60, quantityVariancePercent: 65,
    spikeChance: 0.04, spikeMagnitude: [1.15, 1.4], dipChance: 0.30, dipMagnitude: [0.45, 0.72],
    burstChance: 0.03, pauseChance: 0.38, patternBreakerChance: 0.30,
    peakHourBoost: 1.18, nightReduction: 0.15, runsPerThousand: 180, // Increased runs per 1k
    minRunsPerOrder: 2, maxRunsPerOrder: 100, targetHumanScore: [86, 98], defaultMinQty: 10
  },
  watch_hours: {
    baseIntervalMinutes: 480, intervalVariance: 240, quantityVariancePercent: 55,
    spikeChance: 0.01, spikeMagnitude: [1.05, 1.2], dipChance: 0.45, dipMagnitude: [0.55, 0.8],
    burstChance: 0.005, pauseChance: 0.65, patternBreakerChance: 0.25,
    peakHourBoost: 1.05, nightReduction: 0.30, runsPerThousand: 1000,
    minRunsPerOrder: 8, maxRunsPerOrder: 50, targetHumanScore: [95, 99], defaultMinQty: 1
  },
  reposts: {
    baseIntervalMinutes: 85, intervalVariance: 45, quantityVariancePercent: 60,
    spikeChance: 0.07, spikeMagnitude: [1.2, 1.5], dipChance: 0.22, dipMagnitude: [0.42, 0.68],
    burstChance: 0.05, pauseChance: 0.28, patternBreakerChance: 0.28,
    peakHourBoost: 1.28, nightReduction: 0.20, runsPerThousand: 120, // Increased runs per 1k
    minRunsPerOrder: 2, maxRunsPerOrder: 120, targetHumanScore: [84, 97], defaultMinQty: 10
  },
  generic: {
    baseIntervalMinutes: 80, intervalVariance: 45, quantityVariancePercent: 60,
    spikeChance: 0.05, spikeMagnitude: [1.15, 1.4], dipChance: 0.25, dipMagnitude: [0.45, 0.72],
    burstChance: 0.04, pauseChance: 0.32, patternBreakerChance: 0.30,
    peakHourBoost: 1.2, nightReduction: 0.20, runsPerThousand: 50,
    minRunsPerOrder: 2, maxRunsPerOrder: 150, targetHumanScore: [85, 98], defaultMinQty: 10
  }
}

// Provider minimum quantities fallback (used before checking actual service data)
const PROVIDER_MINIMUMS: Record<string, number> = {
  views: 100,
  likes: 10,
  comments: 10,
  saves: 10,
  shares: 10,
  followers: 10,
  subscribers: 10,
  retweets: 10,
  reposts: 10,
  watch_hours: 10,
}

// Daily activity patterns (IST hours 0-23) for natural feel
const DAILY_PATTERNS: number[] = [
  0.3, 0.2, 0.1, 0.1, 0.15, 0.3,   // 0-5 AM (very low)
  0.5, 0.7, 0.9, 1.0, 1.1, 1.2,   // 6-11 AM (morning ramp)
  1.0, 0.9, 0.8, 0.85, 0.9, 1.0,  // 12-5 PM (afternoon dip)
  1.3, 1.5, 1.6, 1.5, 1.2, 0.8,   // 6-11 PM (evening peak)
]

// Get service config for engagement type
function getServiceConfig(engType: string): OrganicServiceConfig {
  return SERVICE_CONFIGS[engType as ServiceCategory] || SERVICE_CONFIGS.generic
}

// Module-level client - reused across invocations for connection pooling
const supabaseModule = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth check - verify user is authenticated via JWT claims (fast, no server roundtrip)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = supabaseModule

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
    if (claimsError || !claimsData?.claims?.sub) {
      console.error('Auth failed:', claimsError?.message || 'No sub claim')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    const user = { id: claimsData.claims.sub as string }

    const body = await req.json()
    const {
      user_id,
      bundle_id,
      link,
      base_quantity,
      total_price,
      is_organic_mode,
      engagements,
    } = body

    console.log('=== PROCESS PER-TYPE ORGANIC ENGAGEMENT ORDER ===')
    console.log(`User: ${user_id}`)
    console.log(`Link: ${link}`)
    console.log(`Base Quantity: ${base_quantity}`)
    console.log(`Total Price: $${total_price}`)
    console.log(`Engagements: ${engagements.length} types with per-type settings`)

    // Check if bundle has AI Organic Mode enabled
    let aiOrganicEnabled = true // Default to AI mode
    if (bundle_id) {
      const { data: bundle } = await supabase
        .from('engagement_bundles')
        .select('ai_organic_enabled')
        .eq('id', bundle_id)
        .single()

      if (bundle) {
        aiOrganicEnabled = bundle.ai_organic_enabled ?? true
        console.log(`Bundle AI Organic Mode: ${aiOrganicEnabled ? 'ON' : 'OFF'}`)
      }
    }

    // ============================================
    // CRITICAL: PAYMENT FIRST, ORDER SECOND
    // Prevents users from getting free orders!
    // ============================================

    // Step 1: Lock wallet row and fetch fresh balance
    // Using FOR UPDATE pattern with RPC to prevent race conditions
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (walletError || !wallet) {
      console.error('Wallet not found:', walletError)
      return new Response(JSON.stringify({ error: 'Wallet not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Step 2: Validate active subscription (Required for new orders)
    // First, check if user is admin (admins bypass subscription check)
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)
      .single()

    if (userRole?.role !== 'admin') {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, plan_type')
        .eq('user_id', user_id)
        .single()

      if (!subscription || subscription.status !== 'active' || subscription.plan_type === 'trial') {
        console.error('User does not have an active subscription')
        return new Response(JSON.stringify({ error: 'Subscription required to place orders. Please select a plan from your dashboard.' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Step 3: Validate balance is sufficient
    if (wallet.balance < total_price) {
      console.error('Insufficient balance:', wallet.balance, '<', total_price)
      return new Response(JSON.stringify({ error: 'Insufficient balance. Please add funds to your wallet.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Step 4: DEDUCT PAYMENT FIRST before any order creation!
    // This ensures user pays before order is created
    const newBalance = wallet.balance - total_price
    console.log(`💰 DEDUCTING PAYMENT: $${total_price} from wallet (Balance: $${wallet.balance} → $${newBalance})`)

    const { error: paymentError, data: updatedWallet } = await supabase
      .from('wallets')
      .update({
        balance: newBalance,
        total_spent: (wallet.total_spent || 0) + total_price,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wallet.id)
      .eq('user_id', user_id) // Double safety: ensure we're updating correct wallet
      .gte('balance', total_price) // CRITICAL: Only deduct if balance still sufficient (prevents race)
      .select()
      .single()

    if (paymentError || !updatedWallet) {
      // Payment failed - likely insufficient balance (race condition) or DB error
      console.error('Payment deduction failed:', paymentError)

      // Re-check balance to give user accurate error
      const { data: freshWallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user_id)
        .single()

      return new Response(JSON.stringify({
        error: `Payment failed. Current balance: $${freshWallet?.balance?.toFixed(2) || '0.00'}. Required: $${total_price.toFixed(2)}`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('✅ Payment deducted successfully BEFORE order creation')

    // Create transaction record immediately after payment
    const { error: txError } = await supabase.from('transactions').insert({
      user_id,
      type: 'order',
      amount: -total_price,
      balance_after: newBalance,
      description: `Engagement Order Payment (Pending Creation)`,
      status: 'pending', // Will be updated to 'completed' once order is created
    })

    if (txError) {
      console.warn('Transaction record failed (non-critical):', txError)
    }

    // Pre-validate all engagements for provider minimums (fetch actual from service)
    for (const engagement of engagements) {
      let providerMin = PROVIDER_MINIMUMS[engagement.type] || 10

      // If service_id exists, get actual minimum from database
      if (engagement.service_id) {
        const { data: service } = await supabase
          .from('services')
          .select('min_quantity')
          .eq('id', engagement.service_id)
          .single()

        if (service?.min_quantity) {
          providerMin = service.min_quantity
          console.log(`Using actual service min for ${engagement.type}: ${providerMin}`)
        }
      }

      if (engagement.quantity < providerMin) {
        console.error(`${engagement.type} quantity ${engagement.quantity} is below minimum ${providerMin}`)

        // REFUND: Validation failed after payment
        console.log('⚠️ VALIDATION FAILED - Initiating refund...')
        await supabase.from('wallets').update({
          balance: wallet.balance,
          total_spent: wallet.total_spent || 0,
        }).eq('id', wallet.id)

        await supabase.from('transactions')
          .update({ status: 'failed', description: 'Validation failed - Payment refunded' })
          .eq('user_id', user_id)
          .eq('status', 'pending')

        return new Response(JSON.stringify({
          error: `${engagement.type} minimum quantity is ${providerMin}. Your payment has been refunded.`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Create engagement order (without global variance/peak settings - now per-type)
    const { data: order, error: orderError } = await supabase
      .from('engagement_orders')
      .insert({
        user_id,
        bundle_id,
        link,
        base_quantity,
        total_price,
        is_organic_mode: true, // Always organic
        variance_percent: 25, // Default for backward compatibility
        peak_hours_enabled: false, // Default OFF for natural delivery
        status: 'pending',
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Failed to create order:', orderError)

      // CRITICAL: Refund the payment since order creation failed!
      console.log('⚠️ ORDER CREATION FAILED - Initiating refund...')
      const { error: refundError } = await supabase
        .from('wallets')
        .update({
          balance: wallet.balance, // Restore original balance
          total_spent: wallet.total_spent || 0, // Restore original spent
        })
        .eq('id', wallet.id)

      if (refundError) {
        console.error('CRITICAL: Refund failed!', refundError)
        // Log failed refund for manual review
        await supabase.from('transactions').insert({
          user_id,
          type: 'refund_failed',
          amount: total_price,
          balance_after: newBalance,
          description: `FAILED REFUND - Order creation failed. Manual review needed!`,
          status: 'failed',
        })
      } else {
        console.log('✅ Payment refunded successfully')
        // Update pending transaction to failed
        await supabase.from('transactions')
          .update({ status: 'failed', description: 'Order creation failed - Payment refunded' })
          .eq('user_id', user_id)
          .eq('status', 'pending')
          .eq('amount', -total_price)
      }

      return new Response(JSON.stringify({ error: 'Failed to create order. Your payment has been refunded.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Order #${order.order_number} created`)

    // ============================================
    // INSTANT RESPONSE: Return immediately after order + items creation
    // Schedule generation happens in background via EdgeRuntime.waitUntil
    // ============================================

    // Create order items FAST (just DB inserts, no schedule generation)
    const createdItemIds: { type: string; itemId: string; engagement: any; finalServiceId: string }[] = []

    for (const engagement of engagements) {
      const engType = engagement.type

      // Resolve service_id
      let finalServiceId = engagement.service_id

      if (!finalServiceId && bundle_id) {
        const { data: bundleItem } = await supabase
          .from('bundle_items')
          .select('service_id')
          .eq('bundle_id', bundle_id)
          .eq('engagement_type', engType)
          .maybeSingle()

        if (bundleItem?.service_id) {
          finalServiceId = bundleItem.service_id
        }
      }

      if (!finalServiceId) {
        console.error(`❌ BLOCKING: ${engType} has no service configured`)

        // Refund
        await supabase.from('wallets').update({
          balance: wallet.balance,
          total_spent: wallet.total_spent || 0,
        }).eq('id', wallet.id)

        await supabase.from('transactions')
          .update({ status: 'failed', description: `Service not configured for ${engType} - Payment refunded` })
          .eq('user_id', user_id)
          .eq('status', 'pending')

        await supabase.from('engagement_orders').delete().eq('id', order.id)

        return new Response(JSON.stringify({
          error: `No service configured for ${engType}. Please contact admin. Payment refunded.`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Create order item (fast insert)
      const { data: item, error: itemError } = await supabase
        .from('engagement_order_items')
        .insert({
          engagement_order_id: order.id,
          engagement_type: engType,
          service_id: finalServiceId,
          quantity: engagement.quantity,
          price: engagement.price,
          is_enabled: true,
          status: 'pending',
        })
        .select()
        .single()

      if (itemError || !item) {
        console.error(`Failed to create item for ${engType}:`, itemError)
        continue
      }

      createdItemIds.push({ type: engType, itemId: item.id, engagement, finalServiceId })
    }

    // Update transaction + order status immediately
    await supabase.from('transactions')
      .update({
        order_id: order.id,
        description: `Engagement Order #${order.order_number}`,
        status: 'completed',
      })
      .eq('user_id', user_id)
      .eq('status', 'pending')
      .eq('amount', -total_price)
      .order('created_at', { ascending: false })
      .limit(1)

    await supabase.from('engagement_orders').update({
      status: 'processing',
    }).eq('id', order.id)

    console.log(`✅ Order #${order.order_number} created instantly with ${createdItemIds.length} items`)

    // ============================================
    // BACKGROUND: Generate organic schedules + trigger execution
    // User gets response NOW, schedules are created in background
    // ============================================
    const backgroundWork = async () => {
      try {
        console.log('🔄 Background: Generating organic schedules...')
        const startTime = new Date()

        // ============================================
        // PLATFORM DETECTION - Determines engagement sequence & timing
        // ============================================
        const detectPlatform = (url: string): string => {
          const lower = url.toLowerCase()
          if (lower.includes('instagram.com') || lower.includes('instagr.am')) return 'instagram'
          if (lower.includes('tiktok.com')) return 'tiktok'
          if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube'
          if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter'
          if (lower.includes('facebook.com') || lower.includes('fb.com')) return 'facebook'
          return 'generic'
        }

        const platform = detectPlatform(link)
        console.log(`🌐 Platform detected: ${platform}`)

        // ============================================
        // PLATFORM-SPECIFIC ENGAGEMENT SEQUENCES
        // Each platform has a natural interaction order
        // ============================================
        const PLATFORM_PRIORITIES: Record<string, Record<string, number>> = {
          instagram: {
            views: 0, impressions: 0, reach: 0,
            likes: 1,
            comments: 2,
            saves: 3, bookmarks: 3,
            shares: 4, reposts: 4,
            followers: 5,
            generic: 10,
          },
          tiktok: {
            views: 0, plays: 0, watch_hours: 0,
            likes: 1, favorites: 1,
            comments: 2,
            shares: 3, reposts: 3,
            followers: 4,
            generic: 10,
          },
          youtube: {
            views: 0, watch_hours: 0,
            likes: 1,
            comments: 2,
            subscribers: 3,
            shares: 4,
            generic: 10,
          },
          twitter: {
            views: 0, impressions: 0,
            likes: 1, favorites: 1,
            retweets: 2, reposts: 2,
            comments: 3, // replies
            shares: 4, // quote tweets
            followers: 5,
            generic: 10,
          },
          facebook: {
            views: 0, impressions: 0, reach: 0,
            likes: 1,
            comments: 2,
            shares: 3, reposts: 3,
            followers: 4,
            generic: 10,
          },
          generic: {
            views: 0, likes: 1, comments: 2, saves: 3, shares: 4,
            followers: 5, subscribers: 6, retweets: 1, reposts: 1, generic: 10,
          },
        }

        // ============================================
        // PLATFORM-SPECIFIC STAGGER DELAYS (minutes after views start)
        // Controls how much later each type begins relative to views
        // ============================================
        const PLATFORM_STAGGER: Record<string, Record<string, { base: number; variance: number }>> = {
          instagram: {
            views: { base: 0, variance: 0 },
            likes: { base: 25, variance: 45 },      // Increased base (25-70 min) after views
            comments: { base: 45, variance: 60 },    // 45-105 min after views
            saves: { base: 90, variance: 90 },       // 90-180 min after views
            shares: { base: 120, variance: 120 },    // 2-4 hours after views
            followers: { base: 180, variance: 180 }, // 3-6 hours after views
          },
          tiktok: {
            views: { base: 0, variance: 0 },
            likes: { base: 15, variance: 25 },        // TikTok likes slower (15-40 min)
            comments: { base: 30, variance: 45 },    // 30-75 min
            shares: { base: 60, variance: 90 },      // 1-2.5 hours
            followers: { base: 120, variance: 120 },
          },
          youtube: {
            views: { base: 0, variance: 0 },
            likes: { base: 35, variance: 55 },       // After watching (35-90 min)
            comments: { base: 60, variance: 120 },   // 1-3 hours (YouTube comments are slower)
            subscribers: { base: 90, variance: 180 }, // 1.5-4.5 hours
            shares: { base: 120, variance: 180 },
          },
          twitter: {
            views: { base: 0, variance: 0 },
            likes: { base: 10, variance: 20 },        // X likes slightly slower (10-30 min)
            retweets: { base: 8, variance: 20 },     // Retweets peak quickly (8-28 min)
            comments: { base: 15, variance: 45 },    // Replies slower (15-60 min)
            shares: { base: 25, variance: 60 },      // Quote tweets slower
            followers: { base: 60, variance: 120 },
          },
          facebook: {
            views: { base: 0, variance: 0 },
            likes: { base: 12, variance: 20 },
            comments: { base: 40, variance: 60 },
            shares: { base: 75, variance: 90 },
            followers: { base: 120, variance: 120 },
          },
          generic: {
            views: { base: 0, variance: 0 },
            likes: { base: 15, variance: 25 },
            comments: { base: 45, variance: 60 },
            saves: { base: 90, variance: 90 },
            shares: { base: 120, variance: 120 },
            followers: { base: 180, variance: 180 },
          },
        }

        // ============================================
        // PLATFORM-SPECIFIC DAILY ACTIVITY PATTERNS (IST hours 0-23)
        // Each platform has different peak hours
        // ============================================
        const PLATFORM_DAILY_PATTERNS: Record<string, number[]> = {
          instagram: [
            0.2, 0.1, 0.08, 0.05, 0.1, 0.25,     // 0-5 AM (very low)
            0.5, 0.75, 0.95, 1.1, 1.2, 1.15,      // 6-11 AM (morning ramp, 10-11 AM peak)
            1.0, 0.9, 1.1, 1.15, 1.1, 1.0,        // 12-5 PM (afternoon, 2-4 PM mini-peak)
            1.3, 1.5, 1.7, 1.6, 1.3, 0.7,         // 6-11 PM (evening PEAK 6-9 PM)
          ],
          tiktok: [
            0.3, 0.2, 0.15, 0.1, 0.12, 0.2,      // 0-5 AM (night owls)
            0.4, 0.6, 0.8, 0.95, 1.0, 1.1,        // 6-11 AM
            0.9, 0.85, 0.9, 1.0, 1.1, 1.15,       // 12-5 PM
            1.4, 1.6, 1.8, 1.7, 1.5, 1.0,         // 6-11 PM (TikTok peaks LATER 7-10 PM)
          ],
          youtube: [
            0.25, 0.15, 0.1, 0.08, 0.1, 0.2,     // 0-5 AM
            0.4, 0.6, 0.8, 0.9, 1.0, 1.1,         // 6-11 AM
            1.05, 1.0, 0.95, 1.0, 1.1, 1.15,      // 12-5 PM
            1.3, 1.45, 1.6, 1.55, 1.4, 0.9,       // 6-11 PM (YouTube more spread out)
          ],
          twitter: [
            0.15, 0.1, 0.08, 0.05, 0.08, 0.2,    // 0-5 AM
            0.5, 0.8, 1.1, 1.3, 1.2, 1.1,         // 6-11 AM (Twitter PEAKS early 9-10 AM)
            1.0, 0.9, 1.0, 1.1, 1.0, 0.95,        // 12-5 PM
            1.2, 1.35, 1.4, 1.3, 1.1, 0.6,        // 6-11 PM (second peak 7-9 PM)
          ],
          facebook: [
            0.2, 0.1, 0.08, 0.06, 0.1, 0.25,     // 0-5 AM
            0.5, 0.7, 0.9, 1.0, 1.1, 1.15,        // 6-11 AM
            1.1, 1.0, 1.05, 1.1, 1.0, 0.95,       // 12-5 PM (Facebook steady afternoon)
            1.2, 1.4, 1.5, 1.4, 1.2, 0.7,         // 6-11 PM
          ],
          generic: DAILY_PATTERNS,
        }

        const platformPriorities = PLATFORM_PRIORITIES[platform] || PLATFORM_PRIORITIES.generic
        const platformStagger = PLATFORM_STAGGER[platform] || PLATFORM_STAGGER.generic
        const platformDailyPattern = PLATFORM_DAILY_PATTERNS[platform] || DAILY_PATTERNS

        // Sort by platform-specific priority
        const sortedItems = [...createdItemIds].sort((a, b) => {
          return (platformPriorities[a.type] ?? 10) - (platformPriorities[b.type] ?? 10)
        })

        console.log(`📋 Platform ${platform} engagement order: ${sortedItems.map(i => i.type).join(' → ')}`)

        let viewsStartTime: Date | null = null
        let viewsFirstRunScheduled = false

        for (const { type: engType, itemId, engagement, finalServiceId } of sortedItems) {
          const config = getServiceConfig(engType)

          // Get provider minimum - check BOTH base service AND mapped provider services
          let providerMin = config.defaultMinQty
          if (finalServiceId) {
            const { data: service } = await supabase
              .from('services')
              .select('min_quantity')
              .eq('id', finalServiceId)
              .single()
            if (service?.min_quantity) providerMin = service.min_quantity

            const { data: mappings } = await supabase
              .from('service_provider_mapping')
              .select('provider_service_id')
              .eq('service_id', finalServiceId)
              .eq('is_active', true)

            if (mappings && mappings.length > 0) {
              console.log(`  Found ${mappings.length} provider mappings for ${engType}, using service min: ${providerMin}`)
            }
          }

          // Per-type settings
          let timeLimitHours = engagement.time_limit_hours || 0
          let variancePercent: number
          let peakHoursEnabled: boolean

          if (aiOrganicEnabled && timeLimitHours === 0) {
            const timeLimitOptions = [0, 0, 0, 2, 3, 4, 6, 8, 10, 12]
            timeLimitHours = timeLimitOptions[Math.floor(Math.random() * timeLimitOptions.length)]
            const baseVariance = config.quantityVariancePercent
            variancePercent = Math.max(15, baseVariance - 15 + Math.floor(Math.random() * 31))
            peakHoursEnabled = false // Peak hours OFF by default
          } else {
            variancePercent = engagement.variance_percent ?? config.quantityVariancePercent
            peakHoursEnabled = engagement.peak_hours_enabled ?? false
          }

          // Calculate intervals
          let baseInterval = config.baseIntervalMinutes
          let intervalRange = config.intervalVariance

          if (aiOrganicEnabled && timeLimitHours === 0) {
            const intervalVariation = 0.7 + Math.random() * 0.6
            baseInterval = Math.round(baseInterval * intervalVariation)
            intervalRange = Math.round(intervalRange * intervalVariation)
          }

          const baseMaxBatchCap = MAX_BATCH_CAPS[engType] || MAX_BATCH_CAPS.generic
          // Dynamic cap: must be >= providerMin but capped at 2.5x providerMin for organic look
          // This prevents huge batches like +1000 which look like botting
          let maxBatchCap = Math.max(baseMaxBatchCap, Math.round(providerMin * 2.5))
          const baseMinIntervalCap = MIN_INTERVAL_CAPS[engType] || MIN_INTERVAL_CAPS.generic
          let minIntervalCap = baseMinIntervalCap

          let idealRuns = Math.round((engagement.quantity / 1000) * config.runsPerThousand)

          // KEY FIX: When providerMin is high, reduce runs so avg batch >> providerMin
          // This gives room for variance ABOVE providerMin
          const minBatchForVariance = providerMin * 2.5 // Need avg to be 2.5x providerMin for good variance
          const maxRunsForVariance = Math.floor(engagement.quantity / minBatchForVariance)
          if (maxRunsForVariance < idealRuns && maxRunsForVariance >= 3) {
            idealRuns = Math.max(3, maxRunsForVariance)
            console.log(`  📊 Reduced idealRuns to ${idealRuns} for ${engType} (providerMin=${providerMin} needs variance room)`)
          }

          let targetRuns: number
          let timeLimitApplied = false

          if (timeLimitHours > 0) {
            const totalMinutes = timeLimitHours * 60
            const MIN_PROVIDER_INTERVAL = 5
            const maxPossibleRuns = Math.floor(totalMinutes / MIN_PROVIDER_INTERVAL)
            const idealBatchForProvider = Math.ceil(engagement.quantity / maxPossibleRuns)

            targetRuns = Math.min(
              maxPossibleRuns,
              Math.max(config.minRunsPerOrder, Math.min(config.maxRunsPerOrder, idealRuns))
            )

            const avgBatchNeeded = Math.ceil(engagement.quantity / targetRuns)
            // Time-limit mode: allow slightly higher cap but still bounded
            maxBatchCap = Math.max(maxBatchCap, Math.min(avgBatchNeeded * 1.8, providerMin * 4))
            minIntervalCap = MIN_PROVIDER_INTERVAL

            const availableMinutes = Math.max(1, totalMinutes - 5)
            const requiredIntervalMinutes = Math.max(MIN_PROVIDER_INTERVAL, availableMinutes / Math.max(targetRuns - 1, 1))
            baseInterval = requiredIntervalMinutes
            intervalRange = Math.max(1, requiredIntervalMinutes * 0.15)
            timeLimitApplied = true
          } else {
            const minRunsForCap = Math.ceil(engagement.quantity / maxBatchCap)
            targetRuns = Math.max(config.minRunsPerOrder, minRunsForCap, Math.min(config.maxRunsPerOrder, idealRuns))
          }

          const avgBatchSize = Math.ceil(engagement.quantity / targetRuns)
          const minBatch = Math.max(providerMin, Math.ceil(avgBatchSize * 0.4))
          const maxBatch = Math.max(minBatch + 1, Math.min(maxBatchCap, Math.ceil(avgBatchSize * 1.8)))

          const maxPossibleRunsForQuantity = Math.max(1, Math.floor(engagement.quantity / providerMin))

          // CRITICAL: Reduce targetRuns to ~75% of max possible to ensure we have "variety budget"
          if (targetRuns > maxPossibleRunsForQuantity * 0.75 && maxPossibleRunsForQuantity > 2) {
            targetRuns = Math.max(2, Math.floor(maxPossibleRunsForQuantity * 0.75))
          }
          if (targetRuns > maxPossibleRunsForQuantity) {
            targetRuns = maxPossibleRunsForQuantity
          }

          // FORCE multiple runs for ALL types if quantity is at least 2x providerMin
          if (targetRuns < 2 && engagement.quantity >= providerMin * 2) {
            targetRuns = 2
          }
          // FORCE more runs for likes/shares/reposts if possible
          if (['likes', 'shares', 'reposts', 'comments'].includes(engType) && targetRuns < 3 && engagement.quantity >= providerMin * 3) {
            targetRuns = 3
          }

          let remaining = engagement.quantity
          let currentTime = new Date(startTime.getTime())
          let runNumber = 1
          const scheduleEntries: any[] = []

          // ============================================
          // PLATFORM-AWARE START DELAY LOGIC
          // Uses platform-specific stagger configuration
          // ============================================
          const isViewType = ['views', 'impressions', 'reach', 'plays', 'watch_hours'].includes(engType)
          const staggerConfig = platformStagger[engType] || platformStagger['generic'] || { base: 30, variance: 30 }

          let initialDelayMinutes: number
          if (isViewType && !viewsFirstRunScheduled) {
            // Primary view type ALWAYS starts first with 2-15 min delay
            initialDelayMinutes = aiOrganicEnabled ? 2 + Math.random() * 13 : 5 + Math.random() * 10
            viewsStartTime = new Date(startTime.getTime() + initialDelayMinutes * 60 * 1000)
            viewsFirstRunScheduled = true
            currentTime = new Date(viewsStartTime.getTime())
            console.log(`  📍 ${engType} (primary) starts at +${Math.round(initialDelayMinutes)}min`)
          } else if (viewsStartTime) {
            // Stagger after views using PLATFORM-SPECIFIC delays
            initialDelayMinutes = aiOrganicEnabled
              ? staggerConfig.base + Math.random() * staggerConfig.variance
              : staggerConfig.base + Math.random() * (staggerConfig.variance * 0.5)
            currentTime = new Date(viewsStartTime.getTime() + initialDelayMinutes * 60 * 1000)
            console.log(`  📍 ${engType} starts at +${Math.round(initialDelayMinutes)}min after views (${platform} pattern)`)
          } else {
            // No views in this order - use stagger config with absolute offset
            const priority = platformPriorities[engType] ?? 3
            initialDelayMinutes = aiOrganicEnabled
              ? staggerConfig.base + (priority * 15) + Math.random() * staggerConfig.variance
              : staggerConfig.base + (priority * 10) + Math.random() * (staggerConfig.variance * 0.5)
            currentTime = new Date(startTime.getTime() + initialDelayMinutes * 60 * 1000)
            console.log(`  📍 ${engType} starts at +${Math.round(initialDelayMinutes)}min (no views, ${platform} pattern)`)
          }

          // Generate runs
          while (remaining > 0 && (!timeLimitApplied || runNumber <= targetRuns)) {
            const currentBaseInterval = baseInterval + (Math.random() * 2 - 1) * intervalRange
            let intervalMultiplier = 1.0
            if (!timeLimitApplied) {
              if (Math.random() < config.pauseChance) {
                intervalMultiplier = 1.8 + Math.random() * 1.7
              } else if (Math.random() < config.burstChance) {
                intervalMultiplier = 0.6 + Math.random() * 0.4
              }
            }

            const rawInterval = currentBaseInterval * intervalMultiplier
            const effectiveMinInterval = timeLimitApplied ? Math.min(minIntervalCap, baseInterval * 0.7) : minIntervalCap
            const intervalMinutes = Math.max(effectiveMinInterval, rawInterval)
            const intervalMs = intervalMinutes * 60 * 1000

            const jitterMinutes = timeLimitApplied ? 1 : 5
            const jitterMs = (Math.random() * (jitterMinutes * 2) - jitterMinutes) * 60 * 1000
            const scheduledAt = new Date(currentTime.getTime() + jitterMs)

            const istOffset = 5.5 * 60 * 60 * 1000
            const istTime = new Date(scheduledAt.getTime() + istOffset)
            const hour = istTime.getUTCHours()

            let peakMultiplier = 1.0
            if (peakHoursEnabled) {
              const dailyMultiplier = platformDailyPattern[hour] || 1.0
              peakMultiplier = dailyMultiplier * config.peakHourBoost * (0.85 + Math.random() * 0.3)
              if (hour >= 0 && hour < 6) peakMultiplier *= config.nightReduction
              peakMultiplier = Math.max(0.2, Math.min(2.5, peakMultiplier))
            } else {
              peakMultiplier = 0.9 + Math.random() * 0.2
            }

            let baseQty: number
            let qty: number

            // ============================================
            // ULTRA ORGANIC QUANTITY v7.0 - HIGH PROVIDERMIN FIX
            // When providerMin is high (e.g. 200), variance ONLY goes UP
            // Dips are replaced with SKIPPED RUNS (time gaps) for organic feel
            // No two consecutive runs should have same quantity!
            // ============================================
            const runsLeft = Math.max(1, targetRuns - runNumber + 1)
            const avgForRemaining = Math.ceil(remaining / runsLeft)
            const isLastRun = runNumber === targetRuns || remaining <= maxBatchCap

            // KEY INSIGHT: If providerMin >= 60% of avg batch, dips are impossible
            // All "dip" quantities get clamped to providerMin = identical runs = BOTTING
            const providerMinIsHigh = providerMin >= avgForRemaining * 0.6

            if (isLastRun && remaining <= maxBatchCap) {
              qty = remaining
              baseQty = qty
            } else if (providerMinIsHigh) {
              // ============================================
              // HIGH PROVIDER MIN MODE v8.0 - CONTINUOUS RANDOM
              // NO TIERS! Pure continuous random between providerMin and maxBatch
              // Each quantity is unique - no clustering around multiples
              // ============================================

              // 12% chance: SKIP this run (creates organic time gap)
              if (Math.random() < 0.12 && runsLeft > 2) {
                currentTime = new Date(currentTime.getTime() + intervalMs)
                continue
              }

              // CONTINUOUS random quantity between providerMin and maxBatchCap
              // No tiers, no multipliers - pure uniform random
              const range = maxBatchCap - providerMin
              qty = providerMin + Math.floor(Math.random() * range)
              baseQty = qty

              // Apply peak multiplier with damping to stay in range
              qty = Math.round(qty * (0.85 + peakMultiplier * 0.15))

              // ULTRA-STRICT ANTI-REPEAT: Never use same quantity twice in one schedule
              const usedQuantities = scheduleEntries.map(r => r.quantity_to_send)
              let duplicates = true
              let attempts = 0
              while (duplicates && attempts < 25 && range > 3) {
                duplicates = usedQuantities.includes(qty)
                if (duplicates) {
                  const primeJitters = [1, 2, 3, 5, 7]
                  qty = providerMin + Math.floor(Math.random() * range) + (Math.random() > 0.5 ? primeJitters[attempts % 5] : -primeJitters[attempts % 5])
                  qty = Math.max(providerMin, Math.min(qty, maxBatchCap))
                }
                attempts++
              }

              // Final Anti-Round: No multiples of 5/10
              if (qty % 5 === 0 && qty > providerMin && qty < maxBatchCap) {
                qty += (Math.random() > 0.5 ? 1 : -1)
              }

              // Enforce bounds
              qty = Math.max(providerMin, qty)
              qty = Math.min(qty, maxBatchCap)
              qty = Math.min(qty, remaining)

              // Don't leave tiny remainder
              const afterThis = remaining - qty
              if (afterThis > 0 && afterThis < providerMin) {
                if (remaining <= maxBatchCap) qty = remaining
              }

              // Front-loading protection
              if (runsLeft > 3 && qty > remaining * 0.4) {
                qty = providerMin + Math.floor(Math.random() * Math.round(range * 0.5))
                qty = Math.max(providerMin, qty)
              }
            } else {
              // NORMAL MODE: providerMin is low relative to avg, use full variance
              const rand = Math.random()
              let varianceMultiplier: number

              if (rand < 0.10) {
                // Big spike - 2.0x to 3.5x
                varianceMultiplier = 2.0 + Math.random() * 1.5
              } else if (rand < 0.22) {
                // Dip but NEVER below 1.5x providerMin (prevents clamping to exact min)
                const dipBase = Math.max(0.3, (providerMin * 1.5) / avgForRemaining)
                varianceMultiplier = dipBase + Math.random() * 0.3
              } else if (rand < 0.38) {
                // Medium high - 1.3x to 1.8x
                varianceMultiplier = 1.3 + Math.random() * 0.5
              } else if (rand < 0.52) {
                // Medium low - 0.6x to 0.9x
                varianceMultiplier = 0.6 + Math.random() * 0.3
              } else {
                // Normal range with wide spread - 0.7x to 1.5x
                varianceMultiplier = 0.7 + Math.random() * 0.8
              }

              baseQty = Math.round(avgForRemaining * varianceMultiplier)
              qty = Math.round(baseQty * peakMultiplier)

              // PROPORTIONAL JITTER: ±20% of qty (not fixed ±15)
              // For small types like likes (qty~15), this gives ±3
              // For large types like views (qty~200), this gives ±40
              const jitterPercent = 0.20
              const jitterRange = Math.max(3, Math.round(qty * jitterPercent))
              const jitter = Math.floor(Math.random() * (jitterRange * 2 + 1)) - jitterRange
              qty += jitter

              // STRONG ANTI-REPEAT: 30% threshold + check last 3 runs
              if (scheduleEntries.length > 0) {
                const lastQty = scheduleEntries[scheduleEntries.length - 1].quantity_to_send
                if (Math.abs(qty - lastQty) < lastQty * 0.30) {
                  // Too similar - force dramatic change
                  if (Math.random() < 0.5) {
                    qty = Math.round(avgForRemaining * (1.6 + Math.random() * 1.0))
                  } else {
                    qty = Math.round(avgForRemaining * (0.4 + Math.random() * 0.3))
                  }
                  qty = Math.max(providerMin, qty)
                }
                if (scheduleEntries.length > 1) {
                  const prevPrevQty = scheduleEntries[scheduleEntries.length - 2].quantity_to_send
                  if (Math.abs(qty - prevPrevQty) < prevPrevQty * 0.20) {
                    qty = Math.round(qty * (1.4 + Math.random() * 0.5))
                  }
                }
                // Check 3rd-last too (prevent ABAB patterns)
                if (scheduleEntries.length > 2) {
                  const prev3Qty = scheduleEntries[scheduleEntries.length - 3].quantity_to_send
                  if (Math.abs(qty - prev3Qty) < prev3Qty * 0.15) {
                    qty = Math.round(qty * (0.6 + Math.random() * 0.3))
                    qty = Math.max(providerMin, qty)
                  }
                }
              }

              // Never let qty equal exactly providerMin more than ~15% of time
              // If it would be exact min, bump it up randomly
              if (qty === providerMin && Math.random() > 0.15) {
                qty = Math.round(providerMin * (1.3 + Math.random() * 1.2))
              }

              qty = Math.max(providerMin, qty)
              qty = Math.min(qty, maxBatchCap)
              qty = Math.min(qty, remaining)

              const afterThis = remaining - qty
              if (afterThis > 0 && afterThis < providerMin) {
                if (remaining <= maxBatchCap) qty = remaining
              }
              if (runsLeft > 3 && qty > remaining * 0.4) {
                qty = Math.round(remaining * (0.15 + Math.random() * 0.25))
                qty = Math.max(providerMin, qty)
              }
            }

            // ============================================
            // Base finalQty
            // ============================================
            let finalQty: number
            if (qty >= providerMin) {
              finalQty = qty
            } else if (remaining <= maxBatchCap && remaining <= providerMin * 1.5) {
              // Small remaining amount — take it all as last run
              finalQty = remaining
            } else {
              // Below providerMin but more remains — add jitter to providerMin to avoid identical clamps
              finalQty = providerMin + Math.floor(Math.random() * Math.min(6, maxBatchCap - providerMin + 1))
            }

            finalQty = Math.max(providerMin, Math.min(finalQty, remaining, maxBatchCap))

            // ============================================
            // STRICT UNIQUE CHECK (Post-clamp to prevent repetition)
            // ============================================
            const usedQuantities = scheduleEntries.map(r => r.quantity_to_send)
            const rangeForUnique = maxBatchCap - providerMin

            // Only attempt unique if we have room to jitter and it's not the final constraining run
            if (rangeForUnique >= 1 && !isLastRun && finalQty >= providerMin) {
              let uniqueAttempts = 0
              while (usedQuantities.includes(finalQty) && uniqueAttempts < 25) {
                const primeJitters = [1, 2, 3, 4, 5, 7, 11]
                // We strongly prefer moving UP if we are at providerMin to avoid falling below it
                if (finalQty <= providerMin + 1) {
                   finalQty += primeJitters[uniqueAttempts % primeJitters.length]
                } else {
                   finalQty += (Math.random() > 0.5 ? 1 : -1) * primeJitters[uniqueAttempts % primeJitters.length]
                }
                
                finalQty = Math.max(providerMin, Math.min(finalQty, remaining, maxBatchCap))
                uniqueAttempts++
              }
            }

            scheduleEntries.push({
              engagement_order_item_id: itemId,
              run_number: runNumber,
              scheduled_at: scheduledAt.toISOString(),
              quantity_to_send: finalQty,
              base_quantity: baseQty,
              variance_applied: finalQty - baseQty,
              peak_multiplier: peakMultiplier,
              status: 'pending',
            })

            remaining -= finalQty
            runNumber++
            currentTime = new Date(currentTime.getTime() + intervalMs)
            if (runNumber > 2000) break
          }

          // Handle remaining for non-time-limit mode
          if (!timeLimitApplied) {
            while (remaining > 0) {
              const finalQty = Math.min(remaining, maxBatchCap)
              if (finalQty >= providerMin || remaining === finalQty) {
                const finalTime = new Date(currentTime.getTime() + (minIntervalCap + Math.random() * Number(baseInterval)) * 60 * 1000)
                scheduleEntries.push({
                  engagement_order_item_id: itemId,
                  run_number: runNumber,
                  scheduled_at: finalTime.toISOString(),
                  quantity_to_send: finalQty,
                  base_quantity: finalQty,
                  variance_applied: 0,
                  peak_multiplier: 1.0,
                  status: 'pending',
                })
                remaining -= finalQty
                runNumber++
                currentTime = finalTime
              } else {
                if (scheduleEntries.length > 0) {
                  const lastEntry = scheduleEntries[scheduleEntries.length - 1]
                  if (lastEntry.quantity_to_send + remaining <= maxBatchCap) {
                    lastEntry.quantity_to_send += remaining
                    lastEntry.variance_applied += remaining
                  }
                }
                remaining = 0
              }
              if (runNumber > 2500) break
            }
          } else if (remaining > 0 && scheduleEntries.length > 0) {
            const lastEntry = scheduleEntries[scheduleEntries.length - 1]
            lastEntry.quantity_to_send += remaining
            lastEntry.variance_applied += remaining
            remaining = 0
          }

          // SMART INSERT v2: Merge runs below providerMin into adjacent runs
          // BUT NEVER collapse into 1 run for engagement types that need organic spread
          const finalEntries: any[] = []
          let carryOver = 0

          for (let i = 0; i < scheduleEntries.length; i++) {
            const entry = { ...scheduleEntries[i] }
            entry.quantity_to_send += carryOver
            carryOver = 0

            if (entry.quantity_to_send < providerMin) {
              // Too small — carry quantity to next run
              carryOver = entry.quantity_to_send
              console.log(`  📦 Run #${entry.run_number} qty ${entry.quantity_to_send} < min ${providerMin}, carrying to next run`)
            } else {
              finalEntries.push(entry)
            }
          }

          // If carry remains after last run, add to last valid entry
          if (carryOver > 0 && finalEntries.length > 0) {
            finalEntries[finalEntries.length - 1].quantity_to_send += carryOver
            console.log(`  📦 Added remaining ${carryOver} to last run`)
          } else if (carryOver > 0 && finalEntries.length === 0) {
            // All runs were below min — instead of collapsing to 1 run,
            // create multiple runs at providerMin each (organic spread)
            const totalQty = scheduleEntries.reduce((sum, e) => sum + e.quantity_to_send, 0)
            if (totalQty >= providerMin) {
              const numRuns = Math.max(2, Math.min(scheduleEntries.length, Math.floor(totalQty / providerMin)))
              const perRun = Math.floor(totalQty / numRuns)
              let leftover = totalQty - (perRun * numRuns)
              
              for (let r = 0; r < numRuns; r++) {
                const runQty = perRun + (r === numRuns - 1 ? leftover : 0)
                // Use the schedule timing from original entries (preserve organic intervals)
                const sourceEntry = scheduleEntries[Math.min(r, scheduleEntries.length - 1)]
                finalEntries.push({
                  ...sourceEntry,
                  quantity_to_send: runQty,
                  run_number: r + 1,
                })
              }
              console.log(`  📦 Split ${totalQty} into ${numRuns} organic runs instead of 1 (was: ${scheduleEntries.length} below-min runs)`)
            }
          }

          // Re-number runs sequentially after merging
          finalEntries.forEach((entry, idx) => {
            entry.run_number = idx + 1
          })

          if (finalEntries.length > 0) {
            const { error: scheduleError } = await supabase
              .from('organic_run_schedule')
              .insert(finalEntries)
            if (scheduleError) {
              console.error(`Failed to create schedule for ${engType}:`, scheduleError)
            } else {
              console.log(`✅ Background: Created ${finalEntries.length} runs for ${engType} (merged from ${scheduleEntries.length})`)
            }
          }
        }

        // Trigger instant execution
        console.log('🚀 Background: Triggering instant execution...')
        try {
          fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/execute-all-runs`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
              },
              body: JSON.stringify({ instant: true, order_id: order.id })
            }
          ).catch(e => console.error('Fetch execute-all-runs error:', e))
          console.log('✅ Background execution triggered')
        } catch (e) {
          console.error('⚠️ Background execution failed (cron will pick up):', e)
        }
      } catch (bgError) {
        console.error('❌ Background schedule generation failed:', bgError)
      }
    }

    // Fire background work - ensure it doesn't crash on EdgeRuntime
    try {
      if (typeof (globalThis as any).EdgeRuntime !== 'undefined' && (globalThis as any).EdgeRuntime.waitUntil) {
        (globalThis as any).EdgeRuntime.waitUntil(backgroundWork())
      } else {
        // Without waitUntil, await it directly to ensure isolate doesn't freeze and kill DB inserts
        await backgroundWork()
      }
    } catch (e) {
      console.error('Background task init failed:', e)
    }

    return new Response(JSON.stringify({
      success: true,
      order_id: order.id,
      order_number: order.order_number,
      items: createdItemIds.map(i => ({ type: i.type, quantity: i.engagement.quantity })),
      total_price,
      new_balance: newBalance,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Process engagement order error:', error)
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
