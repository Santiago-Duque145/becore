import { supabaseAdmin } from '../config/supabase.js';
import { translateDbError } from '../utils/db-errors.js';

function unwrap({ data, error }) {
  if (error) throw translateDbError(error) ?? error;
  return data;
}

// Inserta la fila de bitácora. Un recordatorio repetido falla con AppError DUPLICATE (índice único, 23505)
export async function insertNotification({ userId, type, eventId = null, appointmentId = null, subject, message }) {
  const data = unwrap(
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        event_id: eventId,
        appointment_id: appointmentId,
        subject,
        message,
      })
      .select('id')
      .single(),
  );
  return { id: data.id };
}

export async function markNotificationSent(id) {
  unwrap(await supabaseAdmin.from('notifications').update({ sent_at: new Date().toISOString() }).eq('id', id));
}

export async function markNotificationError(id, errorMessage) {
  unwrap(await supabaseAdmin.from('notifications').update({ error: errorMessage }).eq('id', id));
}

const INBOX_COLUMNS = 'id, type, subject, message, event_id, appointment_id, read_at, created_at';

function toInboxItem(row) {
  return {
    id: row.id,
    type: row.type,
    subject: row.subject,
    message: row.message,
    eventId: row.event_id,
    appointmentId: row.appointment_id,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

// Bandeja de la campana: las del usuario, más recientes primero
export async function listInbox(userId, limit) {
  const data = unwrap(
    await supabaseAdmin
      .from('notifications')
      .select(INBOX_COLUMNS)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit),
  );
  return data.map(toInboxItem);
}

export async function countUnread(userId) {
  const { count, error } = await supabaseAdmin
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);
  if (error) throw translateDbError(error) ?? error;
  return count ?? 0;
}

// Marca una como leída si es del usuario. Devuelve null si no existe o es de otro.
// Si ya estaba leída conserva la fecha original.
export async function markRead(userId, id) {
  const found = unwrap(
    await supabaseAdmin.from('notifications').select(INBOX_COLUMNS).eq('id', id).eq('user_id', userId).maybeSingle(),
  );
  if (!found) return null;
  if (found.read_at) return toInboxItem(found);
  const data = unwrap(
    await supabaseAdmin
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select(INBOX_COLUMNS)
      .single(),
  );
  return toInboxItem(data);
}

// Devuelve cuántas marcó
export async function markAllRead(userId) {
  const data = unwrap(
    await supabaseAdmin
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null)
      .select('id'),
  );
  return data.length;
}
