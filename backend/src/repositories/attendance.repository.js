import { supabaseAdmin } from '../config/supabase.js';
import { translateDbError } from '../utils/db-errors.js';

// Asistencias de un usuario para un conjunto de eventos (myAttendance)
export async function findUserAttendances(userId, eventIds) {
  if (!eventIds.length) return [];
  const { data, error } = await supabaseAdmin
    .from('attendances')
    .select('event_id, status, checked_in')
    .eq('user_id', userId)
    .in('event_id', eventIds);
  if (error) throw translateDbError(error) ?? error;
  return data.map((row) => ({ eventId: row.event_id, status: row.status, checkedIn: row.checked_in }));
}
