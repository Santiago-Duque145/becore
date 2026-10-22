-- =====================================================================
-- Be Core · IA1 · Recomendaciones híbridas con Gemini (docs/specs/ai.md §4)
-- - pgvector (esquema extensions) para los embeddings de eventos y perfiles (768 dimensiones, gemini-embedding-2)
-- - events.tags: gustos del onboarding que Gemini asigna a cada evento (máx. 4)
-- - ai_recommendations: caché de "Para ti" por usuario y variante de la prueba A/B
-- - recommendation_events: mostrado / clic / confirmado por variante (métricas de la A/B)
-- Todo es aditivo: columnas nuevas con valor por defecto o NULL y tablas nuevas. Las filas actuales no cambian.
-- Escritura solo desde Express (secret key); los usuarios solo leen lo propio.
-- profiles.gender, profiles.age_range y data_consent_at NO intervienen en nada de esto.
-- =====================================================================
create extension if not exists vector with schema extensions;

-- ---------- Eventos: etiquetas y embedding ----------
alter table public.events
  add column if not exists tags text[] not null default '{}',
  add column if not exists embedding extensions.vector(768);

alter table public.events
  add constraint events_tags_valid check (
    tags <@ array[
      -- sport
      'football','basketball','volleyball','running','cycling','swimming','martial_arts','fitness',
      -- culture
      'music','theater','dance','cinema','art_workshops','reading',
      -- recreation
      'board_games','hiking','outdoor_plans','video_games'
    ]::text[]
    and cardinality(tags) <= 4
  );

comment on column public.events.tags is 'Gustos del onboarding (slugs de INTERESTS, máx. 4) que Gemini asigna al evento. Vacío = sin etiquetar.';
comment on column public.events.embedding is 'Embedding de título + descripción + etiquetas (gemini-embedding-2, 768 dims, normalizado). NULL = sin calcular.';

create index if not exists events_embedding_hnsw
  on public.events using hnsw (embedding extensions.vector_cosine_ops);

-- ---------- Perfil: embedding de los gustos ----------
alter table public.user_preferences
  add column if not exists embedding extensions.vector(768);

comment on column public.user_preferences.embedding is 'Embedding de gustos, días, franjas, motivaciones y zona. Sin nombre, sexo ni edad. NULL = sin calcular.';

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

-- ---------- RLS: lectura propia; sin políticas de escritura (solo Express con la secret key) ----------
alter table public.ai_recommendations enable row level security;
alter table public.recommendation_events enable row level security;

create policy ai_recommendations_select_own on public.ai_recommendations
  for select to authenticated using (user_id = (select auth.uid()));

create policy recommendation_events_select_own on public.recommendation_events
  for select to authenticated using (user_id = (select auth.uid()));
