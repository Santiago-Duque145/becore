import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { queryKeys } from '../lib/query-keys.js';
import * as api from '../services/notifications.api.js';

// Bandeja de avisos (/avisos)
export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: async () => {
      const { data, meta } = await api.listNotifications(30);
      return { items: data, unread: meta.unread };
    },
  });
}

// Punto naranja de "Avisos". Se refresca solo cuando llega un aviso nuevo por Realtime
// (notifications está en la publicación y su RLS solo deja leer las propias).
export function useUnreadCount() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) return undefined;
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => queryClient.invalidateQueries({ queryKey: queryKeys.notificationsRoot }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return useQuery({
    queryKey: queryKeys.unreadCount,
    queryFn: async () => (await api.getUnreadCount()).data.count,
    enabled: Boolean(userId),
  });
}

// Marcar una o todas: actualiza la caché al instante y luego confirma con el servidor
function useInboxMutation(mutationFn, markLocally) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notificationsRoot });
      const previous = queryClient.getQueryData(queryKeys.notifications);
      const now = new Date().toISOString();
      queryClient.setQueryData(queryKeys.notifications, (data) => {
        if (!data) return data;
        const items = data.items.map((n) => (!n.readAt && markLocally(n, id) ? { ...n, readAt: now } : n));
        return { items, unread: items.filter((n) => !n.readAt).length };
      });
      const unread = queryClient.getQueryData(queryKeys.notifications)?.unread;
      if (unread !== undefined) queryClient.setQueryData(queryKeys.unreadCount, unread);
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.notifications, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.notificationsRoot }),
  });
}

export const useMarkNotificationRead = () =>
  useInboxMutation((id) => api.markNotificationRead(id), (n, id) => n.id === id);

export const useMarkAllNotificationsRead = () =>
  useInboxMutation(() => api.markAllNotificationsRead(), () => true);
