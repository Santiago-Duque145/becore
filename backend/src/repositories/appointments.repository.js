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

// Devuelve solo el id: el service vuelve a leer la cita completa con findAppointmentById
export async function insertAppointment(organizerId, input) {
  const row = unwrap(
    await supabaseAdmin
      .from('appointments')
      .insert({
        organizer_id: organizerId,
        title: input.title,
        notes: input.notes,
        location: input.location,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
      })
      .select('id')
      .single(),
  );
  return row.id;
}

export async function insertParticipants(appointmentId, userIds) {
  unwrap(
    await supabaseAdmin
      .from('appointment_participants')
      .insert(userIds.map((userId) => ({ appointment_id: appointmentId, user_id: userId }))),
  );
}

export async function deleteAppointment(id) {
  unwrap(await supabaseAdmin.from('appointments').delete().eq('id', id));
}

export async function findAppointmentById(id) {
  const row = unwrap(await supabaseAdmin.from('appointments').select(COLUMNS).eq('id', id).maybeSingle());
  return row ? toAppointment(row) : null;
}

export async function markCancelled(id) {
  unwrap(await supabaseAdmin.from('appointments').update({ status: 'cancelled' }).eq('id', id));
}

// Citas donde soy organizador o invitado. upcoming: starts_at >= ahora (ascendente); past: anteriores (descendente)
export async function listForUser(userId, scope) {
  const invited = unwrap(await supabaseAdmin.from('appointment_participants').select('appointment_id').eq('user_id', userId));
  const ids = invited.map((r) => r.appointment_id);
  const mine = ids.length ? `organizer_id.eq.${userId},id.in.(${ids.join(',')})` : `organizer_id.eq.${userId}`;
  const nowIso = new Date().toISOString();

  let query = supabaseAdmin.from('appointments').select(COLUMNS).or(mine);
  query = scope === 'past' ? query.lt('starts_at', nowIso) : query.gte('starts_at', nowIso);
  const rows = unwrap(await query.order('starts_at', { ascending: scope !== 'past' }));
  return rows.map(toAppointment);
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
