-- =====================================================================
-- Be Core · Reglas de franjas y citas en la base (RF-14, RF-15)
-- Fecha: 2026-10-17 (versión 20261021130000: va después de la última
-- migración aplicada, 20261021120000, para que db push no la salte).
--
-- 1. Una franja de disponibilidad no se cruza con otra del mismo organizador
--    (restricción de exclusión availability_slots_no_overlap → SLOT_OVERLAP).
-- 2. Una cita activa (scheduled) no se cruza con otra cita activa del mismo
--    organizador (restricción de exclusión appointments_no_overlap → APPOINTMENT_OVERLAP).
--    Las canceladas no cuentan.
-- 3. Una cita activa queda completamente dentro de una franja del organizador
--    (trigger appointments_within_slot → APPOINTMENT_OUTSIDE_SLOT). El trigger
--    bloquea la franja con FOR SHARE: nadie la borra mientras se inserta la cita.
--
-- Rangos [inicio, fin): dos franjas o citas que solo se tocan no se cruzan.
-- Las restricciones de exclusión resuelven dos inserciones simultáneas: la
-- segunda espera a que la primera confirme y falla con 23P01.
-- Borrar una franja no toca las citas ya agendadas dentro de ella.
-- =====================================================================

create extension if not exists btree_gist with schema extensions;

alter table public.availability_slots
  add constraint availability_slots_no_overlap
  exclude using gist (organizer_id with =, tstzrange(starts_at, ends_at, '[)') with &&);

alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (organizer_id with =, tstzrange(starts_at, ends_at, '[)') with &&)
  where (status = 'scheduled');

create or replace function public.enforce_appointment_within_slot()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status <> 'scheduled' then return new; end if;
  perform 1
     from public.availability_slots s
    where s.organizer_id = new.organizer_id
      and s.starts_at <= new.starts_at
      and s.ends_at >= new.ends_at
    for share;
  if not found then
    raise exception 'APPOINTMENT_OUTSIDE_SLOT' using errcode = 'check_violation';
  end if;
  return new;
end; $$;
revoke execute on function public.enforce_appointment_within_slot() from public, anon, authenticated;

create trigger appointments_within_slot
  before insert or update of starts_at, ends_at, organizer_id, status on public.appointments
  for each row execute function public.enforce_appointment_within_slot();

comment on constraint availability_slots_no_overlap on public.availability_slots is
  'Una franja no se cruza con otra del mismo organizador (SLOT_OVERLAP).';
comment on constraint appointments_no_overlap on public.appointments is
  'Una cita programada no se cruza con otra programada del mismo organizador (APPOINTMENT_OVERLAP).';
