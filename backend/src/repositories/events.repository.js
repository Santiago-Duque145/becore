import { supabaseAdmin } from '../config/supabase.js';
import { translateDbError } from '../utils/db-errors.js';

const COLUMNS =
  'id, title, description, category, location, starts_at, ends_at, capacity, confirmed_count, status, cancelled_at, created_at, updated_at, organizer_id, organizer:profiles!organizer_id(id, full_name)';

const COLUMN_MAP = {
  title: 'title',
  description: 'description',
  category: 'category',
  location: 'location',
  startsAt: 'starts_at',
  endsAt: 'ends_at',
  capacity: 'capacity',
  status: 'status',
};

function toCamel(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    location: row.location,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    capacity: row.capacity,
    confirmedCount: row.confirmed_count,
    status: row.status,
    cancelledAt: row.cancelled_at,
    organizerId: row.organizer_id,
    organizer: row.organizer ? { id: row.organizer.id, fullName: row.organizer.full_name } : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSnake(patch) {
  return Object.fromEntries(
    Object.entries(patch)
      .filter(([key, value]) => key in COLUMN_MAP && value !== undefined)
      .map(([key, value]) => [COLUMN_MAP[key], value]),
  );
}

function unwrap({ data, error }) {
  if (error) throw translateDbError(error) ?? error;
  return data;
}

export async function insertEvent(organizerId, input) {
  const row = { ...toSnake(input), organizer_id: organizerId };
  const data = unwrap(await supabaseAdmin.from('events').insert(row).select(COLUMNS).single());
  return toCamel(data);
}

export async function findEventById(id) {
  const data = unwrap(await supabaseAdmin.from('events').select(COLUMNS).eq('id', id).maybeSingle());
  return data ? toCamel(data) : null;
}

export async function updateEvent(id, patch) {
  const data = unwrap(await supabaseAdmin.from('events').update(toSnake(patch)).eq('id', id).select(COLUMNS).single());
  return toCamel(data);
}

// filters: { statuses, organizerId, scope, category, fromIso, toIso, page, pageSize }
export async function listEvents(filters) {
  const { statuses, organizerId, scope, category, fromIso, toIso, page, pageSize } = filters;
  const nowIso = new Date().toISOString();

  let query = supabaseAdmin.from('events').select(COLUMNS, { count: 'exact' });
  if (organizerId) query = query.eq('organizer_id', organizerId);
  if (statuses) query = query.in('status', statuses);
  if (category) query = query.eq('category', category);

  // Un evento en curso sigue "próximo" aunque su hora de inicio ya pasó
  if (scope === 'upcoming') query = query.or(`starts_at.gte.${nowIso},status.eq.in_progress`);
  else query = query.lt('starts_at', nowIso).neq('status', 'in_progress');

  if (fromIso) query = query.gte('starts_at', fromIso);
  if (toIso) query = query.lt('starts_at', toIso);

  const start = (page - 1) * pageSize;
  query = query.order('starts_at', { ascending: scope === 'upcoming' }).range(start, start + pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw translateDbError(error) ?? error;
  return { rows: data.map(toCamel), total: count ?? 0 };
}

// Eventos publicados que empiezan en la ventana [fromIso, toIso] (recordatorios)
export async function listPublishedStartingBetween(fromIso, toIso) {
  const data = unwrap(
    await supabaseAdmin
      .from('events')
      .select(COLUMNS)
      .eq('status', 'published')
      .gte('starts_at', fromIso)
      .lte('starts_at', toIso),
  );
  return data.map(toCamel);
}

// Pasa a in_progress / finished los eventos que ya empezaron o terminaron. Devuelve cuántos cambió.
export async function refreshEventStatuses() {
  return unwrap(await supabaseAdmin.rpc('refresh_event_statuses'));
}
