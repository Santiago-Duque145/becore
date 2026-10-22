import { supabaseAdmin } from '../config/supabase.js';

// event_ai y user_ai (migración 20261022160000): solo el backend las lee y escribe. Los embeddings nunca se devuelven
// al cliente: aquí solo se escriben, y de event_ai solo se leen las etiquetas.

// pgvector por PostgREST: el vector viaja como texto '[0.1,0.2,…]'
const toVector = (values) => `[${values.join(',')}]`;

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

export async function upsertEventAi(eventId, { tags, embedding }) {
  unwrap(
    await supabaseAdmin
      .from('event_ai')
      .upsert({ event_id: eventId, tags, embedding: embedding ? toVector(embedding) : null }, { onConflict: 'event_id' }),
  );
}

export async function upsertUserAi(userId, embedding) {
  unwrap(await supabaseAdmin.from('user_ai').upsert({ user_id: userId, embedding: toVector(embedding) }, { onConflict: 'user_id' }));
}

// Etiquetas de un evento ([] si aún no tiene)
export async function findEventTags(eventId) {
  const data = unwrap(await supabaseAdmin.from('event_ai').select('tags').eq('event_id', eventId).maybeSingle());
  return data?.tags ?? [];
}

// Estados que se etiquetan: los visibles y los finalizados (sus etiquetas alimentan el bonus por calificaciones de IA3).
// Los borradores se etiquetan al publicarse; los cancelados no se recomiendan.
export const AI_EVENT_STATUSES = ['published', 'in_progress', 'finished'];

// Backfill: eventos sin fila en event_ai o sin embedding
export async function listEventsMissingAi() {
  const events = unwrap(
    await supabaseAdmin
      .from('events')
      .select('id, title, description, category, event_ai(embedding)')
      .in('status', AI_EVENT_STATUSES),
  );
  return events
    .filter((e) => !e.event_ai || e.event_ai.embedding == null)
    .map(({ id, title, description, category }) => ({ id, title, description, category }));
}

// Backfill: usuarios con gustos guardados y sin embedding
export async function listPreferencesMissingAi() {
  const prefs = unwrap(
    await supabaseAdmin.from('user_preferences').select('user_id, interests, days, time_slots, motivations, zone'),
  );
  const done = new Set(unwrap(await supabaseAdmin.from('user_ai').select('user_id')).map((r) => r.user_id));
  return prefs
    .filter((p) => !done.has(p.user_id))
    .map((p) => ({
      userId: p.user_id,
      prefs: { interests: p.interests, days: p.days, timeSlots: p.time_slots, motivations: p.motivations, zone: p.zone },
    }));
}
