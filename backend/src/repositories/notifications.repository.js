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
