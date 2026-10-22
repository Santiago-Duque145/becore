import { supabaseAdmin } from '../config/supabase.js';

// event_ai y user_ai (migración 20261022160000): solo el backend las lee y escribe. Los embeddings nunca se devuelven
// al cliente: se leen únicamente para calcular la similitud dentro del backend (recommendations/hybrid.js).

// pgvector por PostgREST: el vector viaja como texto '[0.1,0.2,…]' en los dos sentidos
const toVector = (values) => `[${values.join(',')}]`;
const fromVector = (text) => (typeof text === 'string' ? JSON.parse(text) : (text ?? null));

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

// Backfill: eventos sin embedding (o todos con all = true, p. ej. si cambió el texto del embedding)
export async function listEventsForAi({ all = false } = {}) {
  const events = unwrap(
    await supabaseAdmin
      .from('events')
      .select('id, title, description, category, event_ai(updated_at, embedding)')
      .in('status', AI_EVENT_STATUSES),
  );
  return events
    .filter((e) => all || !e.event_ai || e.event_ai.embedding == null)
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

// ---------- IA3 · "Para ti" ----------

// Etiquetas y embedding de varios eventos: { [eventId]: { tags, embedding } } (solo backend)
export async function findEventAiByIds(eventIds) {
  if (!eventIds.length) return {};
  const rows = unwrap(await supabaseAdmin.from('event_ai').select('event_id, tags, embedding').in('event_id', eventIds));
  return Object.fromEntries(rows.map((r) => [r.event_id, { tags: r.tags, embedding: fromVector(r.embedding) }]));
}

export async function findUserEmbedding(userId) {
  const row = unwrap(await supabaseAdmin.from('user_ai').select('embedding').eq('user_id', userId).maybeSingle());
  return fromVector(row?.embedding);
}

// Caché de "Para ti" (ai_recommendations). Solo la vigente: { variant, items, expiresAt } o null
export async function findCachedRecommendations(userId) {
  const row = unwrap(
    await supabaseAdmin
      .from('ai_recommendations')
      .select('variant, items, expires_at')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle(),
  );
  return row ? { variant: row.variant, items: row.items, expiresAt: row.expires_at } : null;
}

export async function saveCachedRecommendations(userId, { variant, items, ttlMs }) {
  const now = Date.now();
  unwrap(
    await supabaseAdmin.from('ai_recommendations').upsert(
      {
        user_id: userId,
        variant,
        items,
        generated_at: new Date(now).toISOString(),
        expires_at: new Date(now + ttlMs).toISOString(),
      },
      { onConflict: 'user_id' },
    ),
  );
}

// Al cambiar los gustos o calificar, el orden guardado ya no sirve
export async function deleteCachedRecommendations(userId) {
  unwrap(await supabaseAdmin.from('ai_recommendations').delete().eq('user_id', userId));
}

// recommendation_events: [{ userId, eventId, variant, action, source }]
export async function insertRecommendationEvents(rows) {
  if (!rows.length) return;
  unwrap(
    await supabaseAdmin.from('recommendation_events').insert(
      rows.map((r) => ({ user_id: r.userId, event_id: r.eventId, variant: r.variant, action: r.action, source: r.source })),
    ),
  );
}

// Bonus por calificaciones: categorías y etiquetas de los eventos que el usuario calificó con ≥ minStars
export async function findLikedSignals(userId, minStars = 4) {
  const rated = unwrap(
    await supabaseAdmin.from('event_ratings').select('event_id').eq('user_id', userId).gte('stars', minStars),
  ).map((r) => r.event_id);
  if (!rated.length) return { categories: [], tags: [] };
  const events = unwrap(await supabaseAdmin.from('events').select('category, event_ai(tags)').in('id', rated));
  return {
    categories: [...new Set(events.map((e) => e.category))],
    tags: [...new Set(events.flatMap((e) => e.event_ai?.tags ?? []))],
  };
}

// ---------- IA4 · clics, confirmados y métricas ----------

// Último "mostrado" de ese evento a ese usuario desde sinceIso: { variant, source } o null
export async function findLatestShown(userId, eventId, sinceIso) {
  const row = unwrap(
    await supabaseAdmin
      .from('recommendation_events')
      .select('variant, source')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .eq('action', 'shown')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
  return row ?? null;
}

// Para las métricas: todas las filas con el correo del organizador del evento (para excluir la demo)
export async function listRecommendationEventsForMetrics() {
  const rows = unwrap(
    await supabaseAdmin
      .from('recommendation_events')
      .select('user_id, event_id, variant, source, action, events(organizer:profiles!organizer_id(email))'),
  );
  return rows.map((r) => ({
    userId: r.user_id,
    eventId: r.event_id,
    variant: r.variant,
    source: r.source,
    action: r.action,
    organizerEmail: r.events?.organizer?.email ?? null,
  }));
}

// Estrellas que dieron los usuarios a esos eventos: [{ userId, eventId, stars }]
export async function listRatingsFor(eventIds) {
  if (!eventIds.length) return [];
  const rows = unwrap(await supabaseAdmin.from('event_ratings').select('user_id, event_id, stars').in('event_id', eventIds));
  return rows.map((r) => ({ userId: r.user_id, eventId: r.event_id, stars: r.stars }));
}
