-- =====================================================================
-- Be Core · IA7 · Búsqueda en lenguaje natural (docs/specs/ai.md §IA7)
-- - match_event_embeddings: los eventos más parecidos a una consulta, ordenados por distancia coseno con el índice
--   HNSW de event_ai (IA1). Solo la puede ejecutar el backend (service_role).
-- - search_events: registro de búsquedas para el informe (modo, resultados, si se abrió alguno). SIN user_id: la
--   consulta se guarda después de quitarle correos y teléfonos, y no se puede ligar a una persona.
-- Todo es aditivo: una función y una tabla nuevas. Las tablas y filas actuales no cambian.
-- =====================================================================

create function public.match_event_embeddings(p_query extensions.vector(768), p_limit int default 50)
returns table (event_id uuid, similarity double precision)
language sql
stable
security definer
set search_path = ''
as $$
  select ea.event_id, 1 - (ea.embedding operator(extensions.<=>) p_query) as similarity
  from public.event_ai ea
  where ea.embedding is not null
  order by ea.embedding operator(extensions.<=>) p_query
  limit least(greatest(p_limit, 1), 200);
$$;

comment on function public.match_event_embeddings is 'IA7: event_id y similitud coseno de los eventos más parecidos a la consulta (índice HNSW). Solo backend.';

revoke all on function public.match_event_embeddings(extensions.vector, int) from public, anon, authenticated;
grant execute on function public.match_event_embeddings(extensions.vector, int) to service_role;

-- ---------- Registro de búsquedas ----------
create table public.search_events (
  id              uuid primary key default gen_random_uuid(),
  query_text      text not null check (char_length(query_text) between 1 and 200),
  mode            text not null check (mode in ('semantic', 'classic')),
  results_count   int not null check (results_count >= 0),
  opened_event_id uuid references public.events (id) on delete set null,
  created_at      timestamptz not null default now()
);

create index search_events_created_idx on public.search_events (created_at);

comment on table public.search_events is 'IA7: búsquedas de Descubre (consulta sin correos ni teléfonos, sin user_id). Solo backend.';

-- RLS activado y SIN políticas + sin permisos de tabla: solo Express (secret key) la usa
alter table public.search_events enable row level security;
revoke all on public.search_events from anon, authenticated;
