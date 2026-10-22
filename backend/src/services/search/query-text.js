// IA7 · Texto de la consulta. A Gemini (y a search_events) solo va la consulta, y sin datos de contacto: se quitan
// correos y números de teléfono antes de enviarla o guardarla.
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
// 7 o más dígitos, con espacios, puntos, guiones o paréntesis entre medio (+57 300 123 4567, 604-123-4567…)
const PHONE = /\+?\d[\d\s().-]{5,}\d/g;

export function scrubQuery(q) {
  return String(q ?? '')
    .replace(EMAIL, ' ')
    .replace(PHONE, (match) => (match.replace(/\D/g, '').length >= 7 ? ' ' : match))
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

// minúsculas, sin tildes y espacios colapsados: clave de la caché de embeddings y base de la coincidencia literal
export const normalizeQuery = (q) =>
  String(q ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
