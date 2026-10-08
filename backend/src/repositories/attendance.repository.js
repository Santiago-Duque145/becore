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

// Cupos: el backend nunca los recalcula, solo llama a las funciones SQL (database.md §4)
async function callAttendanceRpc(fn, eventId, userId) {
  const { data, error } = await supabaseAdmin.rpc(fn, { p_event_id: eventId, p_user_id: userId });
  if (error) throw translateDbError(error) ?? error;
  return data;
}

export const confirmAttendance = (eventId, userId) => callAttendanceRpc('confirm_attendance', eventId, userId);

export const cancelAttendance = (eventId, userId) => callAttendanceRpc('cancel_attendance', eventId, userId);
