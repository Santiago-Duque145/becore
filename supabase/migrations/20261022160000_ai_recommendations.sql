-- =====================================================================
-- Be Core · IA1 · Recomendaciones híbridas con Gemini (docs/specs/ai.md §4)
-- - pgvector (esquema extensions) para los embeddings (768 dimensiones, gemini-embedding-2)
-- - event_ai: etiquetas (gustos del onboarding, máx. 4) y embedding de cada evento
-- - user_ai: embedding de los gustos de cada usuario
--   Van en tablas aparte y NO en events / user_preferences: events está en la publicación de Realtime (cada cambio
--   mandaría ~10 KB de vector a cada pantalla suscrita) y user_preferences se puede leer desde el navegador (RLS de
--   lectura propia). event_ai y user_ai no tienen políticas: solo el backend las lee y escribe; los embeddings
--   nunca salen al frontend.
-- - ai_recommendations: caché de "Para ti" por usuario y variante de la prueba A/B
-- - recommendation_events: mostrado / clic / confirmado por variante (métricas de la A/B)
-- Todo es aditivo: tablas nuevas. Las tablas y filas actuales no cambian.
-- profiles.gender, profiles.age_range y data_consent_at NO intervienen en nada de esto.
-- =====================================================================
create extension if not exists vector with schema extensions;

-- ---------- Eventos: etiquetas y embedding ----------
create table public.event_ai (
  event_id   uuid primary key references public.events (id) on delete cascade,
  tags       text[] not null default '{}',
  embedding  extensions.vector(768),
  updated_at timestamptz not null default now(),
  constraint event_ai_tags_valid check (
    tags <@ array[
      -- sport
      'football','basketball','volleyball','running','cycling','swimming','martial_arts','fitness',
      -- culture
      'music','theater','dance','cinema','art_workshops','reading',
      -- recreation
      'board_games','hiking','outdoor_plans','video_games'
    ]::text[]
    and cardinality(tags) <= 4
  )
);

comment on table public.event_ai is 'IA por evento: etiquetas de Gemini y embedding. Solo backend (sin políticas RLS, fuera de Realtime).';
comment on column public.event_ai.tags is 'Gustos del onboarding (slugs de INTERESTS, máx. 4) que Gemini asigna al evento. Vacío = sin etiquetar.';
comment on column public.event_ai.embedding is 'Embedding de título + descripción + etiquetas (gemini-embedding-2, 768 dims, normalizado). NULL = sin calcular.';

create index event_ai_embedding_hnsw on public.event_ai using hnsw (embedding extensions.vector_cosine_ops);

create trigger event_ai_set_updated_at
  before update on public.event_ai
  for each row execute function public.set_updated_at();

-- ---------- Usuarios: embedding de los gustos ----------
create table public.user_ai (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  embedding  extensions.vector(768) not null,
  updated_at timestamptz not null default now()
);

comment on table public.user_ai is 'Embedding de gustos, días, franjas, motivaciones y zona (sin nombre, sexo ni edad). Solo backend.';

create trigger user_ai_set_updated_at
  before update on public.user_ai
  for each row execute function public.set_updated_at();

-- ---------- Caché de recomendaciones ----------
create table public.ai_recommendations (
  user_id      uuid primary key references public.profiles (id) on delete cascade,
  variant      text not null check (variant in ('rules', 'ai')),
  items        jsonb not null check (jsonb_typeof(items) = 'array'),  -- [{ "eventId": uuid, "score": number, "reason": text }]
  generated_at timestamptz not null default now(),
  expires_at   timestamptz not null,
  check (expires_at > generated_at)
);

comment on table public.ai_recommendations is 'Caché de "Para ti" por usuario (6 h). Se borra al cambiar gustos, calificar o publicarse/editarse un evento.';

-- ---------- Eventos de la prueba A/B ----------
create table public.recommendation_events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  event_id   uuid not null references public.events (id) on delete cascade,
  variant    text not null check (variant in ('rules', 'ai')),
  action     text not null check (action in ('shown', 'clicked', 'confirmed')),
  created_at timestamptz not null default now()
);

create index recommendation_events_variant_idx on public.recommendation_events (variant, action);
create index recommendation_events_user_event_idx on public.recommendation_events (user_id, event_id);

-- "clicked" y "confirmed" una vez por usuario y evento; "shown" se repite y las métricas cuentan pares distintos
create unique index recommendation_events_once
  on public.recommendation_events (user_id, event_id, action)
  where action <> 'shown';

comment on table public.recommendation_events is 'Mostrado / clic / confirmado por variante de la prueba A/B (docs/specs/ai.md §10).';

-- ---------- RLS ----------
-- event_ai y user_ai: RLS activado y SIN políticas → anon y authenticated no leen ni escriben nada. Además se les
-- quitan los permisos de tabla. Solo Express (secret key, que salta RLS) las usa.
alter table public.event_ai enable row level security;
alter table public.user_ai enable row level security;
revoke all on public.event_ai from anon, authenticated;
revoke all on public.user_ai from anon, authenticated;

-- ai_recommendations y recommendation_events: lectura propia; sin políticas de escritura (solo Express)
alter table public.ai_recommendations enable row level security;
alter table public.recommendation_events enable row level security;

create policy ai_recommendations_select_own on public.ai_recommendations
  for select to authenticated using (user_id = (select auth.uid()));

create policy recommendation_events_select_own on public.recommendation_events
  for select to authenticated using (user_id = (select auth.uid()));
