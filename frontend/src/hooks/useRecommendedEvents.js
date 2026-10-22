import { queryOptions, useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/query-keys.js';
import { listRecommendedEvents } from '../services/events.api.js';

// Carrusel "Para ti". Vive bajo la clave ['events'], así que confirmar asistencia también lo refresca
// (el evento confirmado deja de ser candidato). Las opciones se comparten con la precarga del arranque.
export const recommendedQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.recommendedEvents,
    queryFn: async () => (await listRecommendedEvents(6)).data,
  });

// enabled: Descubre solo lo pide cuando se muestra (sin filtro, búsqueda ni mapa).
export function useRecommendedEvents(enabled = true) {
  return useQuery({ ...recommendedQueryOptions(), enabled });
}
