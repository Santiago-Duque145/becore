import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/query-keys.js';
import * as eventsApi from '../services/events.api.js';

export function useEvent(id) {
  return useQuery({
    queryKey: queryKeys.event(id),
    queryFn: async () => (await eventsApi.getEvent(id)).data,
    // Un evento que no existe no va a aparecer al reintentar
    retry: (failureCount, error) => error?.code !== 'EVENT_NOT_FOUND' && failureCount < 1,
  });
}

// Todas las mutaciones de evento invalidan listas y detalle (clave raíz 'events')
function useEventMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventsRoot });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard('organizer') });
    },
  });
}

export const useCreateEvent = () => useEventMutation(async (body) => (await eventsApi.createEvent(body)).data);
export const useUpdateEvent = (id) => useEventMutation(async (body) => (await eventsApi.updateEvent(id, body)).data);
export const useCancelEvent = (id) => useEventMutation(async () => (await eventsApi.cancelEvent(id)).data);
export const usePublishEvent = (id) => useEventMutation(async () => (await eventsApi.publishEvent(id)).data);
