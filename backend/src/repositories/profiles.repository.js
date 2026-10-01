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
