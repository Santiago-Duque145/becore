import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from '../config/supabase.js';
import { extensionFor } from '../constants/avatars.js';
import { AppError } from '../utils/app-error.js';

// Subidas con URL firmada: el backend decide quién sube y dónde (carpeta = id del usuario);
// el navegador sube el archivo directo a Storage con el token y luego confirma la ruta a la API.

// path opcional: lo fija el backend (p. ej. el original de una portada, al lado de ella); nunca lo elige el cliente
export async function createUploadTarget(bucket, userId, contentType, { path = `${userId}/${randomUUID()}.${extensionFor(contentType)}` } = {}) {
  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUploadUrl(path);
  if (error) throw new AppError(502, 'STORAGE_ERROR', 'No pudimos preparar la subida, intenta de nuevo');
  return { bucket, path, token: data.token };
}

// La ruta confirmada debe estar en la carpeta del propio usuario (nadie referencia archivos ajenos)
export function assertOwnPath(userId, path) {
  const [folder, file, ...rest] = path.split('/');
  if (folder !== userId || !file || rest.length > 0 || file.includes('..')) {
    throw new AppError(403, 'FORBIDDEN', 'No tienes permiso para esta acción');
  }
}

// P8 · Original de una portada para volver a encuadrarla: "u/abc.webp" → "u/abc-original.webp" (sin columna nueva)
export const originalPathFor = (path) => path.replace(/(\.[a-z]+)$/, '-original$1');

export function publicUrl(bucket, path) {
  return supabaseAdmin.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
