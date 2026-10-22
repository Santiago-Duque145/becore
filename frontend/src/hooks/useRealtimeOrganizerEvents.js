import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';
import { queryKeys } from '../lib/query-keys.js';
import { patchCachedEvents } from '../lib/realtime-events.js';

// Cupo en vivo de TODOS los eventos de un organizador (Mapa en vivo): un solo canal con los UPDATE de sus filas
// de events (ya está en la publicación supabase_realtime) que parcha la caché de listas y de detalle.
export function useRealtimeOrganizerEvents(organizerId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!organizerId) return undefined;
    const channel = supabase
      .channel(`organizer-events-${organizerId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'events', filter: `organizer_id=eq.${organizerId}` },
        ({ new: row }) => queryClient.setQueriesData({ queryKey: queryKeys.eventsRoot }, (data) => patchCachedEvents(data, row)),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizerId, queryClient]);
}
