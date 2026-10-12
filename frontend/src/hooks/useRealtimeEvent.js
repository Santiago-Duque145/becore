import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';
import { queryKeys } from '../lib/query-keys.js';

// Cupo en vivo del detalle (frontend/CLAUDE.md §4.5): escucha los UPDATE de la fila del evento
// (events está en la publicación supabase_realtime) y actualiza la caché. El payload llega en snake_case.
export function useRealtimeEvent(eventId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!eventId) return undefined;
    const channel = supabase
      .channel(`event-${eventId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'events', filter: `id=eq.${eventId}` },
        ({ new: row }) =>
          queryClient.setQueryData(queryKeys.event(eventId), (event) => {
            if (!event) return event;
            const availableSpots = Math.max(row.capacity - row.confirmed_count, 0);
            return {
              ...event,
              confirmedCount: row.confirmed_count,
              capacity: row.capacity,
              status: row.status,
              availableSpots,
              isFull: availableSpots === 0,
            };
          }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, queryClient]);
}
