import { createClient } from '@supabase/supabase-js';
import { locatePlace } from '../src/services/geocode.service.js';
import { PLACES } from './seed-places.js';

// Deja sin coordenadas a CERO eventos (P6): idempotente, solo toca eventos con latitude NULL.
//  1. Los eventos de prueba conocidos reciben las coordenadas de seed-places.js.
//  2. Cualquier otro evento sin ubicación se geocodifica con el texto de su lugar (Nominatim, 1 por segundo).
//     Los que no se puedan ubicar se listan al final para marcarlos a mano editando el evento.
// Uso: npm run seed:coords -w backend
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
  if (data.length) console.info(`[coords] "${title}": ${data.length} evento(s) con las coordenadas de prueba`);
}

const { data: pending, error: pendingError } = await supabase
  .from('events')
  .select('id, title, location, status')
  .is('latitude', null);
if (pendingError) {
  console.error(`[coords] No pude leer los eventos sin ubicación: ${pendingError.message}`);
  process.exit(1);
}

const unresolved = [];
for (const event of pending) {
  const hit = await locatePlace(event.location);
  if (!hit) {
    unresolved.push(event);
    console.warn(`[coords] Sin resultado para "${event.location}" (${event.title})`);
    continue;
  }
  const { error } = await supabase.from('events').update({ latitude: hit.lat, longitude: hit.lng }).eq('id', event.id).is('latitude', null);
  if (error) {
    console.error(`[coords] Error actualizando "${event.title}": ${error.message}`);
    process.exitCode = 1;
    continue;
  }
  updated += 1;
  console.info(`[coords] "${event.title}" [${event.status}] → ${hit.lat}, ${hit.lng} (buscado como "${hit.query}")`);
}

console.info(`[coords] Total actualizados: ${updated}. Sin ubicar: ${unresolved.length}`);
for (const event of unresolved) console.info(`[coords]   - "${event.title}" (${event.location}): márcalo en el mapa editando el evento`);
