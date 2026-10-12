import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

// Actividad "en vivo": escucha los INSERT de activity_log por Supabase Realtime
// (la tabla ya está en la publicación supabase_realtime y su RLS deja leerla a los autenticados).
// No hay un endpoint de actividad global, así que se muestra lo que pase mientras la página está abierta.

function findCachedEventTitle(queryClient, eventId) {
  for (const [, data] of queryClient.getQueriesData({ queryKey: ['events'] })) {
    const events = Array.isArray(data) ? data : (data?.pages?.flatMap((p) => p.data) ?? (data?.id ? [data] : []));
    const match = events.find((e) => e?.id === eventId);
    if (match) return match.title;
  }
  return null;
}

let channelCount = 0;

// Lista de movimientos, más reciente primero. eventIds (opcional) filtra a esos eventos (panel del organizador).
export function useActivityStream({ eventIds, max = 6 } = {}) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState([]); // { id, eventId, actorName, action, eventTitle, createdAt }
  const filterRef = useRef(null);
  filterRef.current = eventIds ? new Set(eventIds) : null;

  useEffect(() => {
    // Nombre único por suscripción: dos componentes pueden escuchar a la vez (ticker y panel)
    const channel = supabase
      .channel(`activity-feed-${++channelCount}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' }, ({ new: row }) => {
        if (filterRef.current && !filterRef.current.has(row.event_id)) return;
        const item = {
          id: row.id,
          eventId: row.event_id,
          actorName: row.actor_name,
          action: row.action,
          eventTitle: findCachedEventTitle(queryClient, row.event_id),
          createdAt: row.created_at,
        };
        setItems((current) => [item, ...current].slice(0, max));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, max]);

  return items;
}

// Ticker de Descubre: solo el último movimiento
export function useActivityFeed() {
  return useActivityStream({ max: 1 })[0] ?? null;
}
