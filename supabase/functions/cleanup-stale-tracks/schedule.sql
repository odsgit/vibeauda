-- Run this ONCE, manually, in the Supabase SQL editor after deploying the
-- cleanup-stale-tracks function. Not applied automatically as a migration
-- because it embeds this project's URL and a secret.
--
-- Prerequisites:
--   1. supabase functions deploy cleanup-stale-tracks --no-verify-jwt
--   2. supabase secrets set CRON_SECRET=<a random string>
--   3. Enable the pg_cron and pg_net extensions (Database > Extensions)
--
-- Replace <PROJECT_REF> and <CRON_SECRET> below with the real values before running.

select cron.schedule(
  'cleanup-stale-tracks-daily',
  '0 3 * * *', -- 03:00 UTC daily
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/cleanup-stale-tracks',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <CRON_SECRET>'
    )
  );
  $$
);

-- To inspect or remove the schedule later:
--   select * from cron.job;
--   select cron.unschedule('cleanup-stale-tracks-daily');
