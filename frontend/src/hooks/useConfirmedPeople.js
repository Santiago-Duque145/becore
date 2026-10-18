import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';

// Todos los confirmados de un evento: solo nombre de pila y foto (GET /events/:id/confirmed)
export function useConfirmedPeople(eventId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['events', 'detail', eventId, 'confirmed'],
    enabled,
    queryFn: async () => (await api.get(`/events/${eventId}/confirmed`)).data,
  });
}
