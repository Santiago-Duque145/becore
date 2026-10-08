import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/query-keys.js';
import * as attendanceApi from '../services/attendance.api.js';

// Aplica el cambio de asistencia a un evento ya cargado en caché
export function applyAttendance(event, confirming) {
  const confirmedCount = Math.max(event.confirmedCount + (confirming ? 1 : -1), 0);
  const availableSpots = Math.max(event.capacity - confirmedCount, 0);
  return {
    ...event,
    confirmedCount,
    availableSpots,
    isFull: availableSpots === 0,
    myAttendance: { status: confirming ? 'confirmed' : 'cancelled', checkedIn: false },
  };
}

// Recorre detalle (objeto) y listas (useInfiniteQuery) tocando solo el evento indicado
function patchCached(data, eventId, patch) {
  if (!data) return data;
  if (Array.isArray(data.pages)) {
    return { ...data, pages: data.pages.map((p) => ({ ...p, data: p.data.map((e) => (e.id === eventId ? patch(e) : e)) })) };
  }
  if (!Array.isArray(data) && data.id === eventId) return patch(data);
  return data;
}

function useAttendanceMutation(eventId, confirming, mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => (await mutationFn(eventId)).data,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.eventsRoot });
      const snapshot = queryClient.getQueriesData({ queryKey: queryKeys.eventsRoot });
      queryClient.setQueriesData({ queryKey: queryKeys.eventsRoot }, (data) =>
        patchCached(data, eventId, (e) => applyAttendance(e, confirming)),
      );
      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.eventsRoot }),
  });
}

export const useConfirmAttendance = (eventId) => useAttendanceMutation(eventId, true, attendanceApi.confirmAttendance);
export const useCancelAttendance = (eventId) => useAttendanceMutation(eventId, false, attendanceApi.cancelAttendance);
