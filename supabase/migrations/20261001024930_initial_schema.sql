-- =====================================================================
-- Be Core · Migración inicial
-- Fuente de verdad del esquema. NO modificar este archivo una vez
-- aplicado: cualquier cambio va en una migración nueva.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tipos enumerados
-- ---------------------------------------------------------------------
create type public.user_role as enum ('organizer', 'participant');
create type public.event_category as enum ('sport', 'culture', 'recreation', 'other');
create type public.event_status as enum ('scheduled', 'cancelled');
create type public.attendance_status as enum ('confirmed', 'cancelled');
create type public.appointment_status as enum ('scheduled', 'cancelled');
create type public.notification_type as enum (
  'event_reminder',
  'event_updated',
  'event_cancelled',
  'appointment_created',
  'appointment_reminder',
  'appointment_cancelled'
);
create type public.activity_action as enum ('confirmed', 'cancelled', 'checked_in');

-- ---------------------------------------------------------------------
-- 2. Función utilitaria para updated_at
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. Tablas
-- ---------------------------------------------------------------------

-- 3.1 Perfiles (1 a 1 con auth.users). El rol vive AQUÍ, no en el JWT.
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null unique,
  full_name   text not null check (char_length(full_name) between 2 and 80),
  role        public.user_role not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 3.2 Eventos
create table public.events (
  id               uuid primary key default gen_random_uuid(),
  organizer_id     uuid not null references public.profiles (id) on delete cascade,
  title            text not null check (char_length(title) between 3 and 100),
  description      text not null default '' check (char_length(description) <= 2000),
  category         public.event_category not null,
  location         text not null check (char_length(location) between 3 and 200),
  starts_at        timestamptz not null,
  ends_at          timestamptz,
  capacity         integer not null check (capacity between 1 and 1000),
  confirmed_count  integer not null default 0,
  status           public.event_status not null default 'scheduled',
  cancelled_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint events_ends_after_starts check (ends_at is null or ends_at > starts_at),
  constraint events_confirmed_within_capacity check (confirmed_count between 0 and capacity)
);
create index events_starts_at_idx on public.events (starts_at);
create index events_organizer_idx on public.events (organizer_id);
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- 3.3 Asistencias (una fila por usuario y evento; se reutiliza al reconfirmar)
create table public.attendances (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  status        public.attendance_status not null default 'confirmed',
  checked_in    boolean not null default false,
  confirmed_at  timestamptz not null default now(),
  cancelled_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint attendances_event_user_unique unique (event_id, user_id)
);
create index attendances_user_idx on public.attendances (user_id);
create trigger attendances_set_updated_at
  before update on public.attendances
  for each row execute function public.set_updated_at();

-- 3.4 Disponibilidad del organizador (RF-15)
create table public.availability_slots (
  id            uuid primary key default gen_random_uuid(),
  organizer_id  uuid not null references public.profiles (id) on delete cascade,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  created_at    timestamptz not null default now(),
  constraint availability_ends_after_starts check (ends_at > starts_at)
);
create index availability_organizer_idx on public.availability_slots (organizer_id, starts_at);

-- 3.5 Citas / reuniones (RF-14)
create table public.appointments (
  id            uuid primary key default gen_random_uuid(),
  organizer_id  uuid not null references public.profiles (id) on delete cascade,
  title         text not null check (char_length(title) between 3 and 100),
  notes         text not null default '' check (char_length(notes) <= 1000),
  location      text not null default '' check (char_length(location) <= 200),
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  status        public.appointment_status not null default 'scheduled',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint appointments_ends_after_starts check (ends_at > starts_at)
);
create index appointments_organizer_idx on public.appointments (organizer_id, starts_at);
create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

create table public.appointment_participants (
  appointment_id  uuid not null references public.appointments (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  primary key (appointment_id, user_id)
);
create index appointment_participants_user_idx on public.appointment_participants (user_id);

-- 3.6 Bitácora de notificaciones por correo (RF-16, RF-17)
create table public.notifications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  type            public.notification_type not null,
  event_id        uuid references public.events (id) on delete cascade,
  appointment_id  uuid references public.appointments (id) on delete cascade,
  subject         text not null,
  sent_at         timestamptz,
  error           text,
  created_at      timestamptz not null default now()
);
-- Un solo recordatorio por persona y evento/cita (idempotencia del cron)
create unique index notifications_event_reminder_once
  on public.notifications (user_id, event_id) where type = 'event_reminder';
create unique index notifications_appointment_reminder_once
  on public.notifications (user_id, appointment_id) where type = 'appointment_reminder';

-- 3.7 Actividad en vivo (alimenta el ticker por Realtime)
create table public.activity_log (
  id          bigint generated always as identity primary key,
  event_id    uuid not null references public.events (id) on delete cascade,
  actor_name  text not null,
  action      public.activity_action not null,
  created_at  timestamptz not null default now()
);
create index activity_log_event_idx on public.activity_log (event_id, created_at desc);

-- ---------------------------------------------------------------------
-- 4. Perfil automático al registrarse (Supabase Auth -> profiles)
--    El frontend envía full_name y role en options.data del signUp.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := new.raw_user_meta_data ->> 'role';
  v_name text := trim(coalesce(new.raw_user_meta_data ->> 'full_name', ''));
begin
  if v_role is null or v_role not in ('organizer', 'participant') then
    raise exception 'INVALID_ROLE';
  end if;
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, v_name, v_role::public.user_role);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 5. Lógica atómica de cupos (RF-10, RF-11, RF-12)
--    Bloquea la fila del evento (FOR UPDATE): dos confirmaciones
--    simultáneas se atienden en fila, nunca hay sobrecupo.
--    Los errores se lanzan con un código en el mensaje que el backend
--    traduce a HTTP (ver docs/specs/api.md).
-- ---------------------------------------------------------------------
create or replace function public.confirm_attendance(p_event_id uuid, p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event  public.events%rowtype;
  v_att    public.attendances%rowtype;
  v_name   text;
begin
  select * into v_event from public.events where id = p_event_id for update;
  if not found then raise exception 'EVENT_NOT_FOUND'; end if;
  if v_event.status <> 'scheduled' then raise exception 'EVENT_NOT_ACTIVE'; end if;
  if v_event.starts_at <= now() then raise exception 'EVENT_STARTED'; end if;
  if v_event.organizer_id = p_user_id then raise exception 'FORBIDDEN'; end if;

  select * into v_att from public.attendances
   where event_id = p_event_id and user_id = p_user_id;
  if found and v_att.status = 'confirmed' then raise exception 'ALREADY_CONFIRMED'; end if;

  if v_event.confirmed_count >= v_event.capacity then raise exception 'EVENT_FULL'; end if;

  insert into public.attendances (event_id, user_id, status, confirmed_at, cancelled_at, checked_in)
  values (p_event_id, p_user_id, 'confirmed', now(), null, false)
  on conflict (event_id, user_id) do update
    set status = 'confirmed', confirmed_at = now(), cancelled_at = null, checked_in = false;

  update public.events set confirmed_count = confirmed_count + 1
   where id = p_event_id
   returning confirmed_count into v_event.confirmed_count;

  select full_name into v_name from public.profiles where id = p_user_id;
  insert into public.activity_log (event_id, actor_name, action)
  values (p_event_id, coalesce(v_name, 'Alguien'), 'confirmed');

  return v_event.confirmed_count;
end;
$$;

create or replace function public.cancel_attendance(p_event_id uuid, p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event  public.events%rowtype;
  v_name   text;
begin
  select * into v_event from public.events where id = p_event_id for update;
  if not found then raise exception 'EVENT_NOT_FOUND'; end if;
  if v_event.starts_at <= now() then raise exception 'EVENT_STARTED'; end if;

  update public.attendances
     set status = 'cancelled', cancelled_at = now(), checked_in = false
   where event_id = p_event_id and user_id = p_user_id and status = 'confirmed';
  if not found then raise exception 'NOT_CONFIRMED'; end if;

  update public.events set confirmed_count = confirmed_count - 1
   where id = p_event_id
   returning confirmed_count into v_event.confirmed_count;

  select full_name into v_name from public.profiles where id = p_user_id;
  insert into public.activity_log (event_id, actor_name, action)
  values (p_event_id, coalesce(v_name, 'Alguien'), 'cancelled');

  return v_event.confirmed_count;
end;
$$;

-- Solo el backend (service_role) puede ejecutar la lógica de cupos
revoke all on function public.confirm_attendance(uuid, uuid) from public, anon, authenticated;
revoke all on function public.cancel_attendance(uuid, uuid) from public, anon, authenticated;
grant execute on function public.confirm_attendance(uuid, uuid) to service_role;
grant execute on function public.cancel_attendance(uuid, uuid) to service_role;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 6. Row Level Security
--    El backend usa la SECRET KEY (bypassa RLS). El frontend solo usa la
--    PUBLISHABLE KEY para Auth y para escuchar Realtime, por eso las
--    únicas políticas son de lectura mínima. Sin política = sin acceso.
-- ---------------------------------------------------------------------
alter table public.profiles                 enable row level security;
alter table public.events                   enable row level security;
alter table public.attendances              enable row level security;
alter table public.availability_slots       enable row level security;
alter table public.appointments             enable row level security;
alter table public.appointment_participants enable row level security;
alter table public.notifications            enable row level security;
alter table public.activity_log             enable row level security;

create policy "profiles: leer el propio"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "events: leer todos (autenticados)"
  on public.events for select to authenticated
  using (true);

create policy "activity_log: leer todo (autenticados)"
  on public.activity_log for select to authenticated
  using (true);

-- ---------------------------------------------------------------------
-- 7. Realtime: cupos que se actualizan solos + ticker de actividad
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.activity_log;
