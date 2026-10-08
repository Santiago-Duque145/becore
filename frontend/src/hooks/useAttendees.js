import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/query-keys.js';
import * as attendanceApi from '../services/attendance.api.js';

export function useAttendees(eventId) {
  return useQuery({
    queryKey: queryKeys.eventAttendees(eventId),
    queryFn: async () => (await attendanceApi.listAttendees(eventId)).data,
  });
}

// Check-in con actualización optimista y marcha atrás si la API rechaza
export function useSetCheckIn(eventId) {
  const queryClient = useQueryClient();
  const key = queryKeys.eventAttendees(eventId);
  return useMutation({
    mutationFn: async ({ userId, checkedIn }) => (await attendanceApi.setCheckIn(eventId, userId, checkedIn)).data,
    onMutate: async ({ userId, checkedIn }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (rows) => rows?.map((a) => (a.userId === userId ? { ...a, checkedIn } : a)));
      return { previous };
    },
    onError: (_err, _vars, context) => queryClient.setQueryData(key, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
