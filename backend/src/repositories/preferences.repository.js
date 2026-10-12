import { supabaseAdmin } from '../config/supabase.js';

const COLUMNS = 'categories, interests, days, time_slots, motivations, zone, updated_at';

function toCamel(row) {
  return {
    categories: row.categories,
    interests: row.interests,
    days: row.days,
    timeSlots: row.time_slots,
    motivations: row.motivations,
    zone: row.zone,
    updatedAt: row.updated_at,
  };
}

export async function findPreferencesByUserId(userId) {
  const { data, error } = await supabaseAdmin.from('user_preferences').select(COLUMNS).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data ? toCamel(data) : null;
}

// Una fila por usuario: crea o reemplaza todas las respuestas
export async function upsertPreferences(userId, { categories, interests, days, timeSlots, motivations, zone }) {
  const { data, error } = await supabaseAdmin
    .from('user_preferences')
    .upsert(
      { user_id: userId, categories, interests, days, time_slots: timeSlots, motivations, zone },
      { onConflict: 'user_id' },
    )
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return toCamel(data);
}
