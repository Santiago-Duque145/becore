// Qué mostrar como avatar: foto subida → avatar de la marca elegido → foto de Google → iniciales.
// (Un avatar elegido a propósito gana sobre la foto que Google trae por defecto.)
export function resolveAvatar({ avatarUrl, avatarPreset } = {}, googleUrl = null) {
  if (avatarUrl) return { src: avatarUrl, preset: null };
  if (avatarPreset) return { src: null, preset: avatarPreset };
  if (googleUrl) return { src: googleUrl, preset: null };
  return { src: null, preset: null };
}
