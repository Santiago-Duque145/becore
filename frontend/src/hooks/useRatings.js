import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/query-keys.js';
import * as ratingsApi from '../services/ratings.api.js';

// Mi calificación de un evento. 404 RATING_NOT_FOUND = aún no calificó (no es un error de pantalla).
export function useMyRating(eventId, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.myRating(eventId),
    enabled,
    queryFn: async () => {
      try {
        return (await ratingsApi.getMyRating(eventId)).data;
      } catch (error) {
        if (error?.code === 'RATING_NOT_FOUND') return null;
        throw error;
      }
    },
    retry: false,
  });
}

export function useRatingSummary(eventId, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.ratingSummary(eventId),
    enabled,
    staleTime: 60_000,
    queryFn: async () => (await ratingsApi.getRatingSummary(eventId)).data,
  });
}

// Crea si no había calificación y edita si ya existía (mismo formulario)
export function useSubmitRating(eventId, { isEdit }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body) =>
      (await (isEdit ? ratingsApi.updateRating(eventId, body) : ratingsApi.createRating(eventId, body))).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.ratingsRoot }),
  });
}
