import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/query-keys.js';
import * as eventsApi from '../services/events.api.js';

export function useEvent(id) {
  return useQuery({
    queryKey: queryKeys.event(id),
    queryFn: async () => (await eventsApi.getEvent(id)).data,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body) => (await eventsApi.createEvent(body)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.eventsRoot }),
  });
}

export function useUpdateEvent(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body) => (await eventsApi.updateEvent(id, body)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.eventsRoot }),
  });
}
