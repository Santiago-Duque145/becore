import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/query-keys.js';
import { listEvents } from '../services/events.api.js';

// filters: { scope, category?, from?, to? }. Cada página trae pageSize eventos ("Ver más").
// Las opciones se comparten con la precarga del arranque (lib/startup-prefetch.js).
export const eventsQueryOptions = (filters) =>
  infiniteQueryOptions({
    queryKey: queryKeys.events(filters),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => listEvents({ ...filters, page: pageParam }),
    getNextPageParam: ({ meta }) => (meta.page * meta.pageSize < meta.total ? meta.page + 1 : undefined),
  });

// enabled = false mientras Descubre muestra resultados de búsqueda (IA7)
export function useEvents(filters, { enabled = true } = {}) {
  return useInfiniteQuery({ ...eventsQueryOptions(filters), enabled });
}
