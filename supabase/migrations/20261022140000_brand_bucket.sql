-- =====================================================================
-- Be Core · P5 · Bucket público "brand" para el logo de los correos
-- Los clientes de correo no cargan SVG: el logo va como PNG en una URL pública y estable
-- (<SUPABASE_URL>/storage/v1/object/public/brand/logo.png). Solo lectura pública; subir archivos
-- requiere la secret key (sin políticas de escritura para anon/authenticated).
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('brand', 'brand', true, 524288, array['image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
