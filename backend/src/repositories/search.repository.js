import { supabaseAdmin } from '../config/supabase.js';

// IA7 (migración 20261022180000): búsqueda por embeddings y registro de búsquedas. Solo backend.

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

// [{ eventId, similarity }] de los eventos más parecidos al vector de la consulta (índice HNSW)
export async function matchEventEmbeddings(vector, limit = 50) {
  const rows = unwrap(await supabaseAdmin.rpc('match_event_embeddings', { p_query: `[${vector.join(',')}]`, p_limit: limit }));
  return (rows ?? []).map((r) => ({ eventId: r.event_id, similarity: Number(r.similarity) }));
}

// row: { id, queryText, mode, resultsCount } (sin datos de la persona)
export async function insertSearchEvent({ id, queryText, mode, resultsCount }) {
  unwrap(await supabaseAdmin.from('search_events').insert({ id, query_text: queryText, mode, results_count: resultsCount }));
}

// Solo el primer resultado abierto de cada búsqueda
export async function markSearchOpened(id, eventId) {
  unwrap(await supabaseAdmin.from('search_events').update({ opened_event_id: eventId }).eq('id', id).is('opened_event_id', null));
}
