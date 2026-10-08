import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/query-keys.js';
import { listEvents } from '../services/events.api.js';

// filters: { scope, category?, from?, to? }. Cada página trae pageSize eventos ("Ver más").
export function useEvents(filters) {
  return useInfiniteQuery({
    queryKey: queryKeys.events(filters),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => listEvents({ ...filters, page: pageParam }),
    getNextPageParam: ({ meta }) => (meta.page * meta.pageSize < meta.total ? meta.page + 1 : undefined),
  });
}
