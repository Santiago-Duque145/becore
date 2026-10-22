import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/query-keys.js';
import { isApiSearch } from '../pages/descubre/descubre-filters.js';
import { recordSearchOpen, searchEvents } from '../services/events.api.js';
import { useDebounced } from './useDebounced.js';

const DEBOUNCE_MS = 400;

// IA7 · Búsqueda de Descubre en la API, 400 ms después de la última tecla y desde 2 letras.
// La clave cuelga de ['events'], así que confirmar asistencia también refresca los resultados.
// Mientras se escribe se mantienen los resultados anteriores (sin parpadeo de skeleton).
export function useEventSearch(text, category) {
  const q = useDebounced(text.trim(), DEBOUNCE_MS);
  const enabled = isApiSearch(q);
  const query = useQuery({
    queryKey: queryKeys.eventSearch(q, category || null),
    queryFn: () => searchEvents(q, category),
    enabled,
    placeholderData: keepPreviousData,
  });
  const { data, meta } = query.data ?? {};
  return {
    ...query,
    events: data ?? [],
    mode: meta?.mode ?? null,
    // Abrir un resultado: se registra sin esperar y sin avisar si falla
    onOpen: (eventId) => () => {
      if (meta?.searchId) recordSearchOpen(meta.searchId, eventId).catch(() => {});
    },
    isPending: enabled ? query.isPending : isApiSearch(text),
  };
}
