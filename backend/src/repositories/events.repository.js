import { supabaseAdmin } from '../config/supabase.js';
import { translateDbError } from '../utils/db-errors.js';

const COLUMNS =
  'id, title, description, category, location, starts_at, ends_at, capacity, confirmed_count, status, cancelled_at, finished_at, cover_url, created_at, updated_at, organizer_id, organizer:profiles!organizer_id(id, full_name, avatar_url, avatar_preset)';

const COLUMN_MAP = {
  title: 'title',
  description: 'description',
  category: 'category',
  location: 'location',
  startsAt: 'starts_at',
  endsAt: 'ends_at',
  capacity: 'capacity',
  status: 'status',
  coverUrl: 'cover_url',
};

function toCamel(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    location: row.location,
    startsAt: row.starts_at,
    finishedAt: row.finished_at,
    coverUrl: row.cover_url,
    endsAt: row.ends_at,
    capacity: row.capacity,
    confirmedCount: row.confirmed_count,
    status: row.status,
    cancelledAt: row.cancelled_at,
    organizerId: row.organizer_id,
    organizer: row.organizer
      ? {
          id: row.organizer.id,
          fullName: row.organizer.full_name,
          avatarUrl: row.organizer.avatar_url,
          avatarPreset: row.organizer.avatar_preset,
        }
      : null,
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

// Varios eventos por id ("Mis eventos"); el orden lo decide el servicio
export async function findEventsByIds(ids) {
  if (!ids.length) return [];
  const data = unwrap(await supabaseAdmin.from('events').select(COLUMNS).in('id', ids));
  return data.map(toCamel);
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

// Candidatos de "Para ti": publicados y futuros, sin los del organizador indicado.
// El filtro confirmed_count < capacity se hace en el servicio (PostgREST no compara dos columnas).
export async function listRecommendationCandidates({ excludeOrganizerId, max = 200 }) {
  const data = unwrap(
    await supabaseAdmin
      .from('events')
      .select(COLUMNS)
      .eq('status', 'published')
      .gt('starts_at', new Date().toISOString())
      .neq('organizer_id', excludeOrganizerId)
      .order('starts_at', { ascending: true })
      .limit(max),
  );
  return data.map(toCamel);
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

// Eventos que pasaron a finished desde sinceIso (para pedir la calificación)
export async function listFinishedSince(sinceIso) {
  const data = unwrap(
    await supabaseAdmin.from('events').select(COLUMNS).eq('status', 'finished').gte('finished_at', sinceIso),
  );
  return data.map(toCamel);
}

// Panel del organizador: sus eventos (todos los estados) que empiezan desde fromIso, orden ascendente
export async function listOrganizerEventsSince(organizerId, fromIso) {
  const data = unwrap(
    await supabaseAdmin
      .from('events')
      .select(COLUMNS)
      .eq('organizer_id', organizerId)
      .gte('starts_at', fromIso)
      .order('starts_at', { ascending: true }),
  );
  return data.map(toCamel);
}

// Estados visibles al público (sin borradores ni cancelados), para el conteo de GET /public/stats
const PUBLIC_STATUSES = ['published', 'in_progress', 'finished'];

// Solo los ids de los eventos públicos que empiezan en [fromIso, toIso): el endpoint público no expone nada más
export async function listPublicEventIdsBetween(fromIso, toIso) {
  const data = unwrap(
    await supabaseAdmin
      .from('events')
      .select('id')
      .in('status', PUBLIC_STATUSES)
      .gte('starts_at', fromIso)
      .lt('starts_at', toIso),
  );
  return data.map((row) => row.id);
}
