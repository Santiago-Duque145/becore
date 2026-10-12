// Chips de categoría de Descubre (Todos, Deporte, Cultura, Recreación) y búsqueda por texto.
// La API no busca por texto: se filtra lo ya cargado por título y lugar, sin tildes ni mayúsculas.

export const CATEGORY_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'sport', label: 'Deporte', noun: 'deporte' },
  { value: 'culture', label: 'Cultura', noun: 'cultura' },
  { value: 'recreation', label: 'Recreación', noun: 'recreación' },
];

const normalize = (text) =>
  (text ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

export function matchesSearch(event, query) {
  const q = normalize(query);
  if (!q) return true;
  return normalize(event.title).includes(q) || normalize(event.location).includes(q);
}

// Título del estado vacío según el filtro activo
export function emptyTitle(category, query) {
  if (query.trim()) return `No encontramos eventos con “${query.trim()}”.`;
  const filter = CATEGORY_FILTERS.find((f) => f.value === category);
  if (filter?.noun) return `No hay eventos de ${filter.noun} por ahora. ¡Vuelve pronto!`;
  return 'Todavía no hay eventos próximos.';
}
