// Avatares predefinidos de la marca. Deben ser idénticos al check profiles_avatar_preset_check de
// supabase/migrations/20261022130000_avatars_and_covers.sql y a frontend/src/assets/avatars/index.jsx.
export const AVATAR_PRESETS = [
  'goleador',
  'corredora',
  'ciclista',
  'nadador',
  'bailarina',
  'guitarrista',
  'pintor',
  'fotografa',
  'lectora',
  'jardinero',
  'ajedrecista',
  'actriz',
];

export const AVATAR_BUCKET = 'avatars';
export const COVER_BUCKET = 'event-covers';

// El navegador comprime a WebP; se aceptan también JPEG y PNG por si el canvas no soporta WebP
export const IMAGE_TYPES = ['image/webp', 'image/jpeg', 'image/png'];
const EXTENSIONS = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };
export const extensionFor = (contentType) => EXTENSIONS[contentType];
