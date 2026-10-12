import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/query-keys.js';
import { listRecommendedEvents } from '../services/events.api.js';

// Carrusel "Para ti". Vive bajo la clave ['events'], así que confirmar asistencia también lo refresca
// (el evento confirmado deja de ser candidato).
export function useRecommendedEvents() {
  return useQuery({
    queryKey: queryKeys.recommendedEvents,
    queryFn: async () => (await listRecommendedEvents(6)).data,
  });
}
