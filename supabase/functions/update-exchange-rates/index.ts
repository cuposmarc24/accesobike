// Edge Function: update-exchange-rates
// Corre diariamente via cron de Supabase (ver supabase/functions/update-exchange-rates/cron.sql)
// Consulta open.er-api.com y actualiza rate_value en event_settings
// Solo actualiza filas donde rate_type = 'usd' o 'eur' (no toca las manuales)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ER_API = 'https://open.er-api.com/v6/latest/USD';

Deno.serve(async (_req) => {
  try {
    // 1. Obtener tasas actualizadas
    const res = await fetch(ER_API);
    if (!res.ok) throw new Error(`ExchangeRate API error: ${res.status}`);
    const data = await res.json();

    const usdToVes: number | null = data.rates?.VES ?? null;
    const usdToEur: number | null = data.rates?.EUR ?? null;
    const eurToVes: number | null = (usdToVes && usdToEur) ? usdToVes / usdToEur : null;

    if (!usdToVes) throw new Error('No se obtuvo tasa VES de la API');

    // 2. Conectar a Supabase con service_role (acceso completo)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 3. Buscar todos los event_settings con rate_type automático
    const { data: settings, error: fetchError } = await supabase
      .from('event_settings')
      .select('event_id, rate_type')
      .in('rate_type', ['usd', 'eur']);

    if (fetchError) throw fetchError;
    if (!settings || settings.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: 'No hay eventos con tasa automática', updated: 0 }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Actualizar cada evento con la tasa correspondiente
    let updated = 0;
    for (const setting of settings) {
      const newRate = setting.rate_type === 'usd' ? usdToVes : eurToVes;
      if (!newRate) continue;

      await supabase.from('event_settings').update({
        rate_value: newRate,
        updated_at: new Date().toISOString()
      }).eq('event_id', setting.event_id).eq('rate_type', setting.rate_type);

      updated++;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        updated,
        rates: { usdToVes, eurToVes },
        lastUpdate: data.time_last_update_utc
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('update-exchange-rates error:', err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
