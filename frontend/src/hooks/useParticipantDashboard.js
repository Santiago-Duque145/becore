import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/query-keys.js';
import { getParticipantDashboard } from '../services/dashboard.api.js';

// "Mis eventos": próximos y pasados con el estado de mi asistencia
export function useParticipantDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard('participant'),
    queryFn: async () => (await getParticipantDashboard()).data,
  });
}
