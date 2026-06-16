-- Ejecutar en el SQL Editor de Supabase Dashboard
-- Programa la Edge Function "update-exchange-rates" para correr todos los días a las 8:00 AM UTC

select cron.schedule(
  'update-exchange-rates-daily',   -- nombre del job (único)
  '0 8 * * *',                     -- cron: 8:00 AM UTC todos los días
  $$
  select net.http_post(
    url := 'https://<TU_PROJECT_REF>.supabase.co/functions/v1/update-exchange-rates',
    headers := '{"Authorization": "Bearer <TU_ANON_KEY>", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Para verificar que el job quedó registrado:
-- select * from cron.job;

-- Para eliminar el job si necesitas recrearlo:
-- select cron.unschedule('update-exchange-rates-daily');
