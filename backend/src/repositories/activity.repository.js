import { supabaseAdmin } from '../config/supabase.js';
import { translateDbError } from '../utils/db-errors.js';

function toCamel(row) {
  return { id: row.id, actorName: row.actor_name, action: row.action, createdAt: row.created_at };
}

export async function insertActivity(eventId, actorName, action) {
  const { error } = await supabaseAdmin
    .from('activity_log')
    .insert({ event_id: eventId, actor_name: actorName, action });
  if (error) throw translateDbError(error) ?? error;
}

// Más reciente primero
export async function listActivity(eventId, limit) {
  const { data, error } = await supabaseAdmin
    .from('activity_log')
    .select('id, actor_name, action, created_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit);
  if (error) throw translateDbError(error) ?? error;
  return data.map(toCamel);
}
