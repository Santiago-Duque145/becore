-- =====================================================================
-- Be Core · P2 · Calificación de eventos finalizados
-- Solo califica quien hizo check-in, dentro de los 7 días siguientes al fin
-- (regla aplicada en Express). La escritura pasa solo por la API.
-- =====================================================================
create table public.event_ratings (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  stars       smallint not null check (stars between 1 and 5),
  tags        text[] not null default '{}'
    check (tags <@ array['well_organized','punctual','good_vibe','would_repeat','good_venue','needs_improvement']::text[]),
  comment     text check (comment is null or char_length(comment) <= 500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (event_id, user_id)
);

create index event_ratings_event_idx on public.event_ratings (event_id);

create trigger event_ratings_set_updated_at
  before update on public.event_ratings
  for each row execute function public.set_updated_at();

alter table public.event_ratings enable row level security;

-- Lectura de las propias; sin políticas de escritura (solo la secret key del backend)
create policy event_ratings_select_own on public.event_ratings
  for select to authenticated using (user_id = (select auth.uid()));

-- Un solo aviso de calificación por usuario y evento (notifyOne lo trata como DUPLICATE)
create unique index notifications_rating_request_once
  on public.notifications (user_id, event_id)
  where type = 'event_rating_request';
