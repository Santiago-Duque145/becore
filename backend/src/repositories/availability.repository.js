import { supabaseAdmin } from '../config/supabase.js';
import { translateDbError } from '../utils/db-errors.js';

const COLUMNS = 'id, organizer_id, starts_at, ends_at, created_at';

function toCamel(row) {
  return {
    id: row.id,
    organizerId: row.organizer_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
  };
}

function unwrap({ data, error }) {
  if (error) throw translateDbError(error) ?? error;
  return data;
}

// Bloques que aún no terminan, en orden ascendente
export async function listFutureSlots(organizerId) {
  const rows = unwrap(
    await supabaseAdmin
      .from('availability_slots')
      .select(COLUMNS)
      .eq('organizer_id', organizerId)
      .gt('ends_at', new Date().toISOString())
      .order('starts_at', { ascending: true }),
  );
  return rows.map(toCamel);
}

export async function insertSlot(organizerId, { startsAt, endsAt }) {
  const row = unwrap(
    await supabaseAdmin
      .from('availability_slots')
      .insert({ organizer_id: organizerId, starts_at: startsAt, ends_at: endsAt })
      .select(COLUMNS)
      .single(),
  );
  return toCamel(row);
}

export async function findSlotById(id) {
  const row = unwrap(await supabaseAdmin.from('availability_slots').select(COLUMNS).eq('id', id).maybeSingle());
  return row ? toCamel(row) : null;
}

export async function deleteSlot(id) {
  unwrap(await supabaseAdmin.from('availability_slots').delete().eq('id', id));
}
