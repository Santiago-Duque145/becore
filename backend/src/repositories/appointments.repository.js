import { supabaseAdmin } from '../config/supabase.js';
import { translateDbError } from '../utils/db-errors.js';

const COLUMNS =
  'id, organizer_id, title, notes, location, starts_at, ends_at, status, created_at, organizer:profiles!organizer_id(id, full_name), participants:appointment_participants(user:profiles!user_id(id, full_name, email))';

export function toAppointment(row) {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    location: row.location,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    organizerId: row.organizer_id,
    organizer: row.organizer ? { id: row.organizer.id, fullName: row.organizer.full_name } : null,
    participants: (row.participants ?? [])
      .filter((p) => p.user)
      .map((p) => ({ id: p.user.id, fullName: p.user.full_name, email: p.user.email })),
  };
}

function unwrap({ data, error }) {
  if (error) throw translateDbError(error) ?? error;
  return data;
}

// Citas programadas que empiezan en la ventana [fromIso, toIso], con invitados (recordatorios)
export async function listScheduledStartingBetween(fromIso, toIso) {
  const rows = unwrap(
    await supabaseAdmin
      .from('appointments')
      .select(COLUMNS)
      .eq('status', 'scheduled')
      .gte('starts_at', fromIso)
      .lte('starts_at', toIso),
  );
  return rows.map(toAppointment);
}
