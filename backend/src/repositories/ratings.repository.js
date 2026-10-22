import { supabaseAdmin } from '../config/supabase.js';
import { translateDbError } from '../utils/db-errors.js';

const COLUMNS = 'id, event_id, user_id, stars, tags, comment, created_at, updated_at';

function unwrap({ data, error }) {
  if (error) throw translateDbError(error) ?? error;
  return data;
}

function toRating(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    stars: row.stars,
    tags: row.tags,
    comment: row.comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findRating(eventId, userId) {
  const row = unwrap(
    await supabaseAdmin.from('event_ratings').select(COLUMNS).eq('event_id', eventId).eq('user_id', userId).maybeSingle(),
  );
  return row ? toRating(row) : null;
}

export async function upsertRating({ eventId, userId, stars, tags, comment }) {
  const row = unwrap(
    await supabaseAdmin
      .from('event_ratings')
      .upsert({ event_id: eventId, user_id: userId, stars, tags, comment }, { onConflict: 'event_id,user_id' })
      .select(COLUMNS)
      .single(),
  );
  return toRating(row);
}

// Todas las calificaciones de un evento, más recientes primero
export async function listEventRatings(eventId) {
  const rows = unwrap(
    await supabaseAdmin.from('event_ratings').select(COLUMNS).eq('event_id', eventId).order('created_at', { ascending: false }),
  );
  return rows.map(toRating);
}

// Promedio y total por evento: { [eventId]: { average, total } }
export async function summarizeByEvents(eventIds) {
  if (!eventIds.length) return {};
  const rows = unwrap(await supabaseAdmin.from('event_ratings').select('event_id, stars').in('event_id', eventIds));
  const acc = {};
  for (const { event_id: id, stars } of rows) {
    acc[id] ??= { sum: 0, total: 0 };
    acc[id].sum += stars;
    acc[id].total += 1;
  }
  return Object.fromEntries(
    Object.entries(acc).map(([id, { sum, total }]) => [id, { average: Math.round((sum / total) * 10) / 10, total }]),
  );
}
