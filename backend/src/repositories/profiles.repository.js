import { supabaseAdmin } from '../config/supabase.js';

function toCamel(row) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    createdAt: row.created_at,
  };
}

export async function findProfileById(id) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return toCamel(data);
}

export async function findProfilesByIds(ids) {
  if (!ids.length) return [];
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, role, created_at')
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

export async function updateProfile(id, { fullName }) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', id)
    .select('id, email, full_name, role, created_at')
    .single();

  if (error || !data) return null;
  return toCamel(data);
}
