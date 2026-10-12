import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

// Ticker "en vivo" de Descubre: escucha los INSERT de activity_log por Supabase Realtime
// (la tabla ya está en la publicación supabase_realtime y su RLS deja leerla a los autenticados).
// No hay un endpoint de actividad global, así que el ticker muestra lo que pase mientras la página
// está abierta. El título del evento sale de la caché de TanStack Query (listas y "Para ti").

function findCachedEventTitle(queryClient, eventId) {
  for (const [, data] of queryClient.getQueriesData({ queryKey: ['events'] })) {
    const events = Array.isArray(data) ? data : (data?.pages?.flatMap((p) => p.data) ?? (data?.id ? [data] : []));
    const match = events.find((e) => e?.id === eventId);
    if (match) return match.title;
  }
  return null;
}

export function useActivityFeed() {
  const queryClient = useQueryClient();
  const [latest, setLatest] = useState(null); // { id, actorName, action, eventTitle, createdAt }

  useEffect(() => {
    const channel = supabase
      .channel('activity-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' }, ({ new: row }) =>
        setLatest({
          id: row.id,
          actorName: row.actor_name,
          action: row.action,
          eventTitle: findCachedEventTitle(queryClient, row.event_id),
          createdAt: row.created_at,
        }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return latest;
}
