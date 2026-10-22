import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/query-keys.js';
import { getAiMetrics } from '../services/recommendations.api.js';

// Métricas de la prueba A/B "Recomendaciones IA vs reglas" (solo organizadores)
export function useAiMetrics() {
  return useQuery({
    queryKey: queryKeys.aiMetrics,
    queryFn: async () => (await getAiMetrics()).data,
    staleTime: 60_000,
  });
}
