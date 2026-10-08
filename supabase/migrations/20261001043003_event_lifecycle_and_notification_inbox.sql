-- Migración ya APLICADA en Supabase (proyecto netomeswlgsahvgqowdq) el 2026-09-30.
-- Copia fiel de supabase_migrations.schema_migrations (versión 20261001043003).
-- NO ejecutar con db push: solo se versiona en el repo para que local = remoto.

create type public.event_status_v2 as enum ('draft', 'published', 'in_progress', 'finished', 'cancelled');
alter table public.events alter column status drop default;
alter table public.events alter column status type public.event_status_v2 using (case status::text when 'scheduled' then 'published' else 'cancelled' end)::public.event_status_v2;
drop type public.event_status;
alter type public.event_status_v2 rename to event_status;
alter table public.events alter column status set default 'draft';
alter table public.events add column published_at timestamptz, add column finished_at timestamptz;
alter table public.events
  add constraint events_published_at_consistent check (status = 'draft' or status = 'cancelled' or published_at is not null),
  add constraint events_cancelled_at_consistent check ((status = 'cancelled') = (cancelled_at is not null)),
  add constraint events_finished_at_consistent check ((status = 'finished') = (finished_at is not null));
comment on column public.events.status is 'Ciclo de vida (doc. de grado, Fig. 3.6): draft→published→in_progress→finished; cancelled desde draft, published o in_progress.';
comment on column public.events.ends_at is 'Opcional. Si es NULL, el evento se considera finalizado 2 horas después de starts_at.';

create or replace function public.enforce_event_transition()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = old.status then return new; end if;
  if not (
       (old.status = 'draft'       and new.status in ('published', 'cancelled'))
    or (old.status = 'published'   and new.status in ('in_progress', 'finished', 'cancelled'))
    or (old.status = 'in_progress' and new.status in ('finished', 'cancelled'))
  ) then
    raise exception 'INVALID_EVENT_TRANSITION: % -> %', old.status, new.status using errcode = 'check_violation';
  end if;
  if new.status = 'published' then new.published_at := coalesce(new.published_at, now()); end if;
  if new.status = 'finished'  then new.finished_at  := coalesce(new.finished_at,  now()); end if;
  if new.status = 'cancelled' then new.cancelled_at := coalesce(new.cancelled_at, now()); end if;
  return new;
end; $$;
create trigger events_enforce_transition before update of status on public.events for each row execute function public.enforce_event_transition();

create or replace function public.stamp_event_on_insert()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status not in ('draft', 'published') then
    raise exception 'INVALID_INITIAL_STATUS: %', new.status using errcode = 'check_violation';
  end if;
  if new.status = 'published' then new.published_at := coalesce(new.published_at, now()); end if;
  return new;
end; $$;
create trigger events_stamp_on_insert before insert on public.events for each row execute function public.stamp_event_on_insert();

create or replace function public.refresh_event_statuses()
returns integer language plpgsql security definer set search_path = '' as $$
declare v_finished integer; v_started integer;
begin
  update public.events set status = 'finished'
   where status in ('published', 'in_progress') and coalesce(ends_at, starts_at + interval '2 hours') <= now();
  get diagnostics v_finished = row_count;
  update public.events set status = 'in_progress' where status = 'published' and starts_at <= now();
  get diagnostics v_started = row_count;
  return v_finished + v_started;
end; $$;
revoke execute on function public.refresh_event_statuses() from public, anon, authenticated;
revoke execute on function public.enforce_event_transition() from public, anon, authenticated;
revoke execute on function public.stamp_event_on_insert() from public, anon, authenticated;

create or replace function public.confirm_attendance(p_event_id uuid, p_user_id uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_event public.events%rowtype; v_att public.attendances%rowtype; v_name text;
begin
  select * into v_event from public.events where id = p_event_id for update;
  if not found then raise exception 'EVENT_NOT_FOUND'; end if;
  if v_event.status <> 'published' then raise exception 'EVENT_NOT_ACTIVE'; end if;
  if v_event.starts_at <= now() then raise exception 'EVENT_STARTED'; end if;
  if v_event.organizer_id = p_user_id then raise exception 'FORBIDDEN'; end if;
  select * into v_att from public.attendances where event_id = p_event_id and user_id = p_user_id;
  if found and v_att.status = 'confirmed' then raise exception 'ALREADY_CONFIRMED'; end if;
  if v_event.confirmed_count >= v_event.capacity then raise exception 'EVENT_FULL'; end if;
  insert into public.attendances (event_id, user_id, status, confirmed_at, cancelled_at, checked_in)
  values (p_event_id, p_user_id, 'confirmed', now(), null, false)
  on conflict (event_id, user_id) do update set status = 'confirmed', confirmed_at = now(), cancelled_at = null, checked_in = false;
  update public.events set confirmed_count = confirmed_count + 1 where id = p_event_id returning confirmed_count into v_event.confirmed_count;
  select full_name into v_name from public.profiles where id = p_user_id;
  insert into public.activity_log (event_id, actor_name, action) values (p_event_id, coalesce(v_name, 'Alguien'), 'confirmed');
  return v_event.confirmed_count;
end; $$;

create or replace function public.cancel_attendance(p_event_id uuid, p_user_id uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_event public.events%rowtype; v_name text;
begin
  select * into v_event from public.events where id = p_event_id for update;
  if not found then raise exception 'EVENT_NOT_FOUND'; end if;
  if v_event.status <> 'published' then raise exception 'EVENT_NOT_ACTIVE'; end if;
  if v_event.starts_at <= now() then raise exception 'EVENT_STARTED'; end if;
  update public.attendances set status = 'cancelled', cancelled_at = now(), checked_in = false
   where event_id = p_event_id and user_id = p_user_id and status = 'confirmed';
  if not found then raise exception 'NOT_CONFIRMED'; end if;
  update public.events set confirmed_count = confirmed_count - 1 where id = p_event_id returning confirmed_count into v_event.confirmed_count;
  select full_name into v_name from public.profiles where id = p_user_id;
  insert into public.activity_log (event_id, actor_name, action) values (p_event_id, coalesce(v_name, 'Alguien'), 'cancelled');
  return v_event.confirmed_count;
end; $$;
revoke execute on function public.confirm_attendance(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.cancel_attendance(uuid, uuid) from public, anon, authenticated;

drop policy if exists "events: leer todos (autenticados)" on public.events;
create policy "events: leer publicados o propios" on public.events for select to authenticated
  using (status <> 'draft' or organizer_id = (select auth.uid()));
create index events_status_starts_at_idx on public.events (status, starts_at);

alter table public.notifications
  add column message text not null default '' constraint notifications_message_check check (char_length(message) <= 500),
  add column read_at timestamptz;
comment on column public.notifications.message is 'Contenido mostrado en la campana y en el cuerpo del correo (campo "mensaje" del diccionario).';
comment on column public.notifications.read_at is 'Fecha de lectura en la app; NULL = no leída (campo "leido" del diccionario).';
comment on column public.notifications.sent_at is 'Fecha de envío por correo; NULL = pendiente.';
create index notifications_user_inbox_idx on public.notifications (user_id, created_at desc);
create index notifications_event_idx on public.notifications (event_id);
create index notifications_appointment_idx on public.notifications (appointment_id);
create index notifications_pending_email_idx on public.notifications (created_at) where sent_at is null and error is null;
create policy "notifications: leer las propias" on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
alter publication supabase_realtime add table public.notifications;

comment on table public.attendances is 'Sin políticas RLS a propósito: solo Express (service_role) lee y escribe.';
comment on table public.appointments is 'Sin políticas RLS a propósito: solo Express (service_role) lee y escribe.';
comment on table public.appointment_participants is 'Sin políticas RLS a propósito: solo Express (service_role) lee y escribe.';
comment on table public.availability_slots is 'Sin políticas RLS a propósito: solo Express (service_role) lee y escribe.';
