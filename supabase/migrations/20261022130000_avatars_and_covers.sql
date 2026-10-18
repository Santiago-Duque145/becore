-- =====================================================================
-- Be Core · P3 · Avatares y portadas de evento
-- - profiles.avatar_url (foto subida o de Google) y profiles.avatar_preset (uno de los 12 avatares de la marca)
-- - events.cover_url (portada subida por el organizador)
-- - buckets públicos de lectura "avatars" y "event-covers". Las subidas usan URLs firmadas que crea el
--   backend con la secret key, por eso no hay políticas de escritura para anon/authenticated.
-- La lista de presets debe coincidir con backend/src/constants/avatars.js y frontend/src/assets/avatars.
-- =====================================================================
alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists avatar_preset text;

alter table public.profiles
  add constraint profiles_avatar_preset_check
  check (avatar_preset is null or avatar_preset in (
    'goleador', 'corredora', 'ciclista', 'nadador', 'bailarina', 'guitarrista',
    'pintor', 'fotografa', 'lectora', 'jardinero', 'ajedrecista', 'actriz'
  ));

alter table public.events
  add column if not exists cover_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/webp', 'image/jpeg', 'image/png']),
  ('event-covers', 'event-covers', true, 3145728, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
