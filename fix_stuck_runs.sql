-- ============================================================
-- FIX: Reset all runs permanently blocked by timeout bug
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Step 1: See how many runs are affected
SELECT 
  COUNT(*) as total_blocked,
  MIN(scheduled_at) as oldest,
  MAX(scheduled_at) as newest
FROM organic_run_schedule
WHERE status = 'failed'
  AND retry_count = 99
  AND error_message ILIKE '%Fetch timed out%';

-- Step 2: Reset them back to pending so they retry on next cron
UPDATE organic_run_schedule
SET
  status = 'pending',
  started_at = NULL,
  provider_order_id = NULL,
  provider_account_id = NULL,
  retry_count = 0,
  error_message = 'Reset after timeout bug fix — will retry automatically',
  completed_at = NULL
WHERE status = 'failed'
  AND retry_count = 99
  AND error_message ILIKE '%Fetch timed out%';

-- Step 3: Also reset any "DANGER: Provider timeout" blocked runs
UPDATE organic_run_schedule
SET
  status = 'pending',
  started_at = NULL,
  provider_order_id = NULL,
  provider_account_id = NULL,
  retry_count = 0,
  error_message = 'Reset after timeout bug fix — will retry automatically',
  completed_at = NULL
WHERE status = 'failed'
  AND retry_count = 99
  AND error_message ILIKE '%DANGER%';

-- Step 4: Verify the fix
SELECT status, COUNT(*) as count
FROM organic_run_schedule
GROUP BY status
ORDER BY count DESC;
