-- Enable the required extensions if they aren't already
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove the old job if it exists to avoid conflicts
SELECT cron.unschedule('organic-runs-minutely');
SELECT cron.unschedule('check-order-status-every-5-min');
SELECT cron.unschedule('sync-service-prices-every-12-hours');

-- 1. Schedule the 'execute-all-runs' edge function to run every minute
SELECT cron.schedule(
  'organic-runs-minutely', 
  '* * * * *', -- Every minute
  $$
    SELECT net.http_post(
        url:='https://nenuwlbnaxesmnpfjlrl.supabase.co/functions/v1/execute-all-runs',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lbnV3bGJuYXhlc21ucGZqbHJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1OTY3MjksImV4cCI6MjA4ODE3MjcyOX0.DM1vKF5CJxrwg5T_XJE_nr5LTNtr4pKNkTQUqvPhuiY", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lbnV3bGJuYXhlc21ucGZqbHJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1OTY3MjksImV4cCI6MjA4ODE3MjcyOX0.DM1vKF5CJxrwg5T_XJE_nr5LTNtr4pKNkTQUqvPhuiY"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- 2. Schedule the 'check-order-status' edge function to run every 5 minutes
SELECT cron.schedule(
  'check-order-status-every-5-min', 
  '*/5 * * * *', -- Every 5 minutes
  $$
    SELECT net.http_post(
        url:='https://nenuwlbnaxesmnpfjlrl.supabase.co/functions/v1/check-order-status',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lbnV3bGJuYXhlc21ucGZqbHJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1OTY3MjksImV4cCI6MjA4ODE3MjcyOX0.DM1vKF5CJxrwg5T_XJE_nr5LTNtr4pKNkTQUqvPhuiY", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lbnV3bGJuYXhlc21ucGZqbHJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1OTY3MjksImV4cCI6MjA4ODE3MjcyOX0.DM1vKF5CJxrwg5T_XJE_nr5LTNtr4pKNkTQUqvPhuiY"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- 3. Schedule the 'sync-service-prices' edge function to run twice a day (every 12 hours)
SELECT cron.schedule(
  'sync-service-prices-every-12-hours', 
  '0 */12 * * *', -- At minute 0 every 12 hours
  $$
    SELECT net.http_post(
        url:='https://nenuwlbnaxesmnpfjlrl.supabase.co/functions/v1/sync-service-prices',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lbnV3bGJuYXhlc21ucGZqbHJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1OTY3MjksImV4cCI6MjA4ODE3MjcyOX0.DM1vKF5CJxrwg5T_XJE_nr5LTNtr4pKNkTQUqvPhuiY", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lbnV3bGJuYXhlc21ucGZqbHJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1OTY3MjksImV4cCI6MjA4ODE3MjcyOX0.DM1vKF5CJxrwg5T_XJE_nr5LTNtr4pKNkTQUqvPhuiY"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
