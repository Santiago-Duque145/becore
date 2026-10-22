-- =====================================================================
-- Be Core · Datos demográficos opcionales y consentimiento de datos
-- Fecha: 2026-10-21
-- Contexto: el director pidió (2026-10-17) sexo y rango de edad en el
-- onboarding, para estadísticas agregadas del proyecto de grado, y la
-- aceptación de la política de tratamiento de datos (Ley 1581 de 2012).
--
-- gender y age_range NO se usan en recomendaciones ni se envían a ninguna IA.
-- Los perfiles existentes quedan con data_consent_at = NULL: la app les pide
-- aceptar la política la próxima vez que entren (sin bloquear el login).
-- =====================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'gender_identity' and typnamespace = 'public'::regnamespace) then
    create type public.gender_identity as enum ('female', 'male', 'other', 'prefer_not_to_say');
  end if;
end
$$;

alter table public.profiles
  add column if not exists gender public.gender_identity,
  add column if not exists age_range text,
  add column if not exists data_consent_at timestamptz;

alter table public.profiles
  add constraint profiles_age_range_check
  check (age_range is null or age_range in ('18-24', '25-34', '35-44', '45-54', '55+'));

comment on column public.profiles.gender is
  'Opcional. Solo para estadísticas agregadas; no se usa en recomendaciones ni se envía a IA.';
comment on column public.profiles.age_range is
  'Opcional. Solo para estadísticas agregadas; no se usa en recomendaciones ni se envía a IA.';
comment on column public.profiles.data_consent_at is
  'Cuándo aceptó la política de tratamiento de datos. NULL = aún no (se le pide al entrar).';
