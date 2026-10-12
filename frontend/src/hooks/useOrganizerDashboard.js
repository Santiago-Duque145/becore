import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/query-keys.js';
import { getOrganizerDashboard } from '../services/dashboard.api.js';

// Panel del organizador: totales y sus eventos con conteos
export function useOrganizerDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard('organizer'),
    queryFn: async () => (await getOrganizerDashboard()).data,
  });
}
