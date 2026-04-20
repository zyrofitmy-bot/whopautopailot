-- ============================================================
-- Add auto-cleanup function for completed engagement orders
-- Keeps history for 2 days.
-- ============================================================

CREATE OR REPLACE FUNCTION cleanup_old_completed_engagement_orders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff TIMESTAMPTZ := now() - interval '2 days';
BEGIN
  -- organic_run_schedule cleanup
  DELETE FROM organic_run_schedule
  WHERE engagement_order_item_id IN (
    SELECT eoi.id FROM engagement_order_items eoi
    JOIN engagement_orders eo ON eo.id = eoi.engagement_order_id
    WHERE eo.status = 'completed' AND eo.updated_at < v_cutoff
  );

  -- engagement_order_items cleanup
  DELETE FROM engagement_order_items
  WHERE engagement_order_id IN (
    SELECT id FROM engagement_orders
    WHERE status = 'completed' AND updated_at < v_cutoff
  );

  -- engagement_orders cleanup
  DELETE FROM engagement_orders
  WHERE status = 'completed' AND updated_at < v_cutoff;

  RAISE LOG '[cleanup_old_completed_engagement_orders] Ran at %', now();
END;
$$;
