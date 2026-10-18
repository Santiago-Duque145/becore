import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/query-keys.js';
import { getPublicStats } from '../services/public.api.js';

const FIVE_MINUTES = 5 * 60 * 1000;

// Conteos del hero de auth. Igual que la caché del backend: 5 min. Si falla, no reintenta ni avisa (el dato se oculta).
export function usePublicStats() {
  return useQuery({
    queryKey: queryKeys.publicStats,
    queryFn: async () => (await getPublicStats()).data,
    staleTime: FIVE_MINUTES,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
