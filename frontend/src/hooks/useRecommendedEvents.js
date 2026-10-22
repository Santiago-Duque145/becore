import { queryOptions, useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/query-keys.js';
import { listRecommendedEvents } from '../services/events.api.js';

// Carrusel "Para ti". Vive bajo la clave ['events'], así que confirmar asistencia también lo refresca
// (el evento confirmado deja de ser candidato). Las opciones se comparten con la precarga del arranque.
export const recommendedQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.recommendedEvents,
    // → { events, emptyReason }: emptyReason solo viene cuando no hay recomendaciones (all_confirmed, no_matches…)
    queryFn: async () => {
      const body = await listRecommendedEvents(6);
      return { events: body.data, emptyReason: body.meta?.emptyReason ?? null };
    },
  });

// enabled: Descubre solo lo pide cuando se muestra (sin filtro, búsqueda ni mapa).
export function useRecommendedEvents(enabled = true) {
  return useQuery({ ...recommendedQueryOptions(), enabled });
}
