// Chips de categoría de Descubre (Todos, Deporte, Cultura, Recreación) y búsqueda por texto.
// Desde 2 letras busca la API (IA7, GET /events/search: en lenguaje natural, con respaldo clásico); con 1 letra se
// filtra lo ya cargado por título y lugar, sin tildes ni mayúsculas.

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

export const SEARCH_MIN_LENGTH = 2;
// Ejemplo en el buscador de Descubre y en el de la barra superior: muestra que se puede escribir como se habla
export const SEARCH_PLACEHOLDER = 'Prueba: fútbol el sábado en la tarde';
export const isApiSearch = (query) => (query ?? '').trim().length >= SEARCH_MIN_LENGTH;

export function matchesSearch(event, query) {
  const q = normalize(query);
  if (!q) return true;
  return normalize(event.title).includes(q) || normalize(event.location).includes(q);
}

// Título del estado vacío según el filtro activo
export function emptyTitle(category, query) {
  if (query.trim()) return 'No encontramos planes así.';
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
    search: isApiSearch(query),
    filters: { scope: 'upcoming', ...(category && { category }), ...(mapView && { pageSize: 50 }) },
    showParaTi: !category && !query && !mapView,
  };
}
