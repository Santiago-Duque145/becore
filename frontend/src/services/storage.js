import { supabase } from '../lib/supabase.js';

// Sube el archivo directo a Storage con la URL firmada que creó la API (target = { bucket, path, token }).
// No lee ni escribe tablas: solo usa el token de un solo uso.
export async function uploadToTarget(target, blob) {
  const { error } = await supabase.storage
    .from(target.bucket)
    .uploadToSignedUrl(target.path, target.token, blob, { contentType: blob.type });
  if (error) throw new Error('No pudimos subir la imagen. Intenta de nuevo');
  return target.path;
}
