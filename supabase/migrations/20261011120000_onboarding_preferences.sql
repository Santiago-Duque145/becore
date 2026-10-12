-- =====================================================================
-- Be Core · Onboarding y preferencias del usuario
-- Fecha: 2026-10-11
-- Contexto: login con Google (Supabase Auth OAuth) + cuestionario de
-- gustos al crear cuenta, para recomendar eventos por afinidad.
--
-- 1) profiles.onboarding_completed_at  → saber si falta el cuestionario.
-- 2) public.user_preferences            → respuestas del cuestionario.
-- 3) handle_new_user()                   → ya no falla con Google:
--    Google no envía "role" ni siempre "full_name". Si no hay rol,
--    se crea como 'participant' y el usuario lo elige en el onboarding.
-- =====================================================================

-- 1) Estado del onboarding ------------------------------------------------
alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz;

comment on column public.profiles.onboarding_completed_at is
  'NULL = el usuario aún no completa (ni omite) el cuestionario de gustos. Mientras sea NULL puede elegir su rol.';

-- Los usuarios que ya existían (seed y pruebas) no deben quedar atrapados en el onboarding.
update public.profiles
   set onboarding_completed_at = now()
 where onboarding_completed_at is null;

-- 2) Preferencias ---------------------------------------------------------
create table if not exists public.user_preferences (
  user_id      uuid primary key references public.profiles (id) on delete cascade,

  -- Derivado por el backend a partir de "interests" (sirve para el match con events.category).
  categories   public.event_category[] not null default '{}',

  -- Gustos concretos (chips del paso 2). Lista cerrada, igual a INTERESTS en backend.
  interests    text[] not null default '{}'
    check (interests <@ array[
      -- sport
      'football','basketball','volleyball','running','cycling','swimming','martial_arts','fitness',
      -- culture
      'music','theater','dance','cinema','art_workshops','reading',
      -- recreation
      'board_games','hiking','outdoor_plans','video_games'
    ]::text[]),

  -- Disponibilidad (paso 3)
  days         text[] not null default '{}'
    check (days <@ array['weekdays','weekends']::text[]),
  time_slots   text[] not null default '{}'
    check (time_slots <@ array['morning','afternoon','evening']::text[]),

  -- Motivación (paso 4)
  motivations  text[] not null default '{}'
    check (motivations <@ array['fun','compete','learn','meet_people','health']::text[]),

  -- Zona o barrio, texto libre opcional (paso 5). No es geolocalización.
  zone         text check (zone is null or char_length(zone) <= 80),

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.user_preferences is
  'Respuestas del cuestionario de onboarding. Escritura solo por Express (service_role); lectura del propio usuario.';

create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

alter table public.user_preferences enable row level security;

create policy "user_preferences: leer las propias"
  on public.user_preferences
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- 3) Alta de usuarios compatible con Google --------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_role text := new.raw_user_meta_data ->> 'role';
  v_name text := trim(coalesce(
                   new.raw_user_meta_data ->> 'full_name',  -- registro con correo y Google
                   new.raw_user_meta_data ->> 'name',       -- Google (respaldo)
                   ''));
begin
  -- Google (OAuth) no envía rol: arranca como participante y lo elige en el onboarding.
  if v_role is null then
    v_role := 'participant';
  end if;

  if v_role not in ('organizer', 'participant') then
    raise exception 'INVALID_ROLE';
  end if;

  -- profiles.full_name exige entre 2 y 80 caracteres.
  if char_length(v_name) < 2 then
    v_name := 'Nuevo usuario';
  end if;
  v_name := left(v_name, 80);

  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, v_name, v_role::public.user_role);

  return new;
end;
$function$;
