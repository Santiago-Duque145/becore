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

const ATTENDEE_COLUMNS = 'user_id, status, checked_in, confirmed_at, user:profiles!user_id(full_name, email)';

function toAttendee(row) {
  return {
    userId: row.user_id,
    fullName: row.user?.full_name ?? '',
    email: row.user?.email ?? '',
    status: row.status,
    checkedIn: row.checked_in,
    confirmedAt: row.confirmed_at,
  };
}

export async function listAttendees(eventId) {
  const { data, error } = await supabaseAdmin.from('attendances').select(ATTENDEE_COLUMNS).eq('event_id', eventId);
  if (error) throw translateDbError(error) ?? error;
  return data.map(toAttendee);
}

export async function findAttendee(eventId, userId) {
  const { data, error } = await supabaseAdmin
    .from('attendances')
    .select(ATTENDEE_COLUMNS)
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw translateDbError(error) ?? error;
  return data ? toAttendee(data) : null;
}

export async function setCheckedIn(eventId, userId, checkedIn) {
  const { error } = await supabaseAdmin
    .from('attendances')
    .update({ checked_in: checkedIn })
    .eq('event_id', eventId)
    .eq('user_id', userId);
  if (error) throw translateDbError(error) ?? error;
}

// Cupos: el backend nunca los recalcula, solo llama a las funciones SQL (database.md §4)
async function callAttendanceRpc(fn, eventId, userId) {
  const { data, error } = await supabaseAdmin.rpc(fn, { p_event_id: eventId, p_user_id: userId });
  if (error) throw translateDbError(error) ?? error;
  return data;
}

export const confirmAttendance = (eventId, userId) => callAttendanceRpc('confirm_attendance', eventId, userId);

export const cancelAttendance = (eventId, userId) => callAttendanceRpc('cancel_attendance', eventId, userId);
