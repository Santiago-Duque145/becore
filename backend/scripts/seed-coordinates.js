import { createClient } from '@supabase/supabase-js';
import { PLACES } from './seed-places.js';

// Pone coordenadas a los eventos de prueba que ya existen y todavía no tienen (P6), para que el mapa no salga
// vacío. Idempotente: solo toca eventos con esos títulos y sin ubicación. Uso: npm run seed:coords -w backend
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let updated = 0;
for (const [title, coords] of Object.entries(PLACES)) {
  const { data, error } = await supabase
    .from('events')
    .update({ latitude: coords.latitude, longitude: coords.longitude })
    .eq('title', title)
    .is('latitude', null)
    .select('id');
  if (error) {
    console.error(`[coords] Error con "${title}": ${error.message}`);
    process.exitCode = 1;
    continue;
  }
  updated += data.length;
  console.info(`[coords] "${title}": ${data.length} evento(s) actualizados`);
}
console.info(`[coords] Total: ${updated}`);
