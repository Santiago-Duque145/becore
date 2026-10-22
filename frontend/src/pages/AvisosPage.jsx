import { useId } from 'react';
import { useNavigate } from 'react-router';
import { BellIcon } from '../components/icons/index.js';
import { Button, EmptyState, ErrorState, Skeleton, useToast } from '../components/ui/index.js';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '../hooks/useNotifications.js';
import { cn } from '../lib/cn.js';
import { formatRelative } from '../lib/format.js';
import { groupNotifications } from '../lib/my-events.js';

// Un aviso: al abrirlo se marca como leído y lleva a su evento o a Citas
function NotificationItem({ notification }) {
  const navigate = useNavigate();
  const markRead = useMarkNotificationRead();
  const unread = !notification.readAt;
  const eventPath = notification.type === 'event_rating_request' ? '/calificar' : '';
  const target = notification.eventId
    ? `/eventos/${notification.eventId}${eventPath}`
    : notification.appointmentId
      ? '/citas'
      : null;

  function open() {
    if (unread) markRead.mutate(notification.id);
    if (target) navigate(target);
  }

  return (
    <li>
      <button
        type="button"
        onClick={open}
        className={cn(
          'focus-ring flex w-full items-start gap-3 rounded-[14px] border px-3.5 py-3 text-left transition-colors',
          unread ? 'border-accent/20 bg-accent/[0.06] hover:border-accent/40' : 'border-white/[0.06] bg-panel hover:border-line',
        )}
      >
        <span
          aria-hidden="true"
          className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', unread ? 'bg-action' : 'bg-transparent')}
        />
        <span className="min-w-0 flex-1">
          <span className={cn('block text-[13px] text-ink', unread ? 'font-semibold' : 'font-medium')}>
            {notification.subject}
            {unread && <span className="sr-only"> (sin leer)</span>}
          </span>
          {notification.message && (
            <span className="mt-0.5 block text-[12px] leading-snug text-ink-muted">{notification.message}</span>
          )}
          <span className="mt-1 block text-[11px] text-ink-muted">{formatRelative(notification.createdAt)}</span>
        </span>
      </button>
    </li>
  );
}

function NotificationGroup({ label, items }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="mb-6">
      <h2 id={id} className="mb-2.5 text-xs font-semibold text-ink-muted">
        {label}
      </h2>
      <ul className="flex flex-col gap-2.5">
        {items.map((n) => (
          <NotificationItem key={n.id} notification={n} />
        ))}
      </ul>
    </section>
  );
}

// /avisos: bandeja de la tabla notifications agrupada por Hoy / Esta semana / Antes
export default function AvisosPage() {
  const toast = useToast();
  const { data, isPending, isError, error, refetch } = useNotifications();
  const markAll = useMarkAllNotificationsRead();
  const unread = data?.unread ?? 0;

  function handleMarkAll() {
    markAll.mutate(undefined, {
      onSuccess: () => toast.success('Listo, ya leíste todo.'),
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      <div className="flex items-center justify-between gap-3 pt-0.5 pb-4">
        <h1 className="font-display text-[21px] font-semibold text-ink md:text-[22px]">Avisos</h1>
        {unread > 0 && (
          <Button variant="ghost" size="sm" onClick={handleMarkAll} loading={markAll.isPending}>
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {isPending && (
        <div className="flex flex-col gap-2.5" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[76px]" />
          ))}
        </div>
      )}
      {isError && <ErrorState message={error.message} onRetry={refetch} />}
      {data?.items.length === 0 && (
        <EmptyState
          icon={BellIcon}
          title="No tienes avisos por ahora."
          description="Aquí te contamos cuando cambie o se cancele un evento al que vas, y te recordamos tus planes."
        />
      )}
      {data?.items.length > 0 &&
        groupNotifications(data.items).map((group) => (
          <NotificationGroup key={group.key} label={group.label} items={group.items} />
        ))}
    </div>
  );
}
