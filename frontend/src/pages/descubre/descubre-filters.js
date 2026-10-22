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

// Lo que Descubre pide a la API según la URL. Lo usan la página y la precarga del arranque (lib/startup-prefetch.js):
// las dos tienen que armar exactamente la misma clave de caché para que la página reutilice lo ya pedido.
export function descubreRequest(params) {
  const category = params.get('cat') ?? '';
  const query = params.get('q') ?? '';
  const mapView = params.get('vista') === 'mapa';
  return {
    filters: { scope: 'upcoming', ...(category && { category }), ...(mapView && { pageSize: 50 }) },
    showParaTi: !category && !query && !mapView,
  };
}
