import { supabaseAdmin } from '../config/supabase.js';

function toCamel(row) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    onboardingCompletedAt: row.onboarding_completed_at,
    gender: row.gender,
    ageRange: row.age_range,
    dataConsentAt: row.data_consent_at,
    createdAt: row.created_at,
  };
}

const PROFILE_COLUMNS =
  'id, email, full_name, role, onboarding_completed_at, gender, age_range, data_consent_at, created_at';

const COLUMN_BY_FIELD = { fullName: 'full_name', gender: 'gender', ageRange: 'age_range', dataConsentAt: 'data_consent_at' };

// Solo los campos presentes (undefined = no tocar; null = borrar el dato)
function toColumns(fields) {
  const columns = {};
  for (const [field, column] of Object.entries(COLUMN_BY_FIELD)) {
    if (fields[field] !== undefined) columns[column] = fields[field];
  }
  return columns;
}

export async function findProfileById(id) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return toCamel(data);
}

export async function findProfilesByIds(ids) {
  if (!ids.length) return [];
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .in('id', ids);
  if (error) throw error;
  return data.map(toCamel);
}

// Participantes por nombre o correo (ilike). Sin q devuelve los primeros por nombre.
export async function searchParticipants(q, limit) {
  let query = supabaseAdmin.from('profiles').select('id, email, full_name').eq('role', 'participant');
  if (q) {
    // Se quitan los caracteres con significado en la sintaxis de filtros de PostgREST
    const term = q.replace(/[,()%*\\]/g, ' ').trim();
    query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
  }
  const { data, error } = await query.order('full_name', { ascending: true }).limit(limit);
  if (error) throw error;
  return data.map((row) => ({ id: row.id, fullName: row.full_name, email: row.email }));
}

// De los ids recibidos, devuelve los que son perfiles con rol participant
export async function findParticipantIds(ids) {
  const { data, error } = await supabaseAdmin.from('profiles').select('id').eq('role', 'participant').in('id', ids);
  if (error) throw error;
  return data.map((row) => row.id);
}

export async function updateProfile(id, fields) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(toColumns(fields))
    .eq('id', id)
    .select(PROFILE_COLUMNS)
    .single();

  if (error || !data) return null;
  return toCamel(data);
}

// Marca el onboarding como completado y fija el rol, solo si seguía pendiente.
// Devuelve null si otro request lo completó antes (el filtro no encontró la fila).
export async function completeOnboarding(id, role, demographics = {}) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ role, onboarding_completed_at: new Date().toISOString(), ...toColumns(demographics) })
    .eq('id', id)
    .is('onboarding_completed_at', null)
    .select(PROFILE_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  return data ? toCamel(data) : null;
}
