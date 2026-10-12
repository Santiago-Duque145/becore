import { useId } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AlertCircleIcon, CalendarIcon } from '../components/icons/index.js';
import { Badge, Chip, EmptyState, ErrorState, LinkButton, Skeleton } from '../components/ui/index.js';
import { useParticipantDashboard } from '../hooks/useParticipantDashboard.js';
import { useMarkNotificationRead, useNotifications } from '../hooks/useNotifications.js';
import { formatTime } from '../lib/format.js';
import { myEventStatus, pendingScheduleChanges } from '../lib/my-events.js';

const dayFormatter = new Intl.DateTimeFormat('es-CO', { day: 'numeric', timeZone: 'America/Bogota' });
const monthFormatter = new Intl.DateTimeFormat('es-CO', { month: 'short', timeZone: 'America/Bogota' });

const TABS = [
  { value: 'proximos', label: 'Próximos', key: 'upcomingEvents' },
  { value: 'pasados', label: 'Pasados', key: 'pastEvents' },
];

const EMPTY = {
  proximos: {
    title: 'Aún no te has apuntado a nada.',
    description: 'Mira lo que se viene en tu comunidad.',
    action: (
      <LinkButton to="/descubre" variant="secondary" size="sm">
        Ver eventos
      </LinkButton>
    ),
  },
  pasados: { title: 'Todavía no tienes eventos pasados.', description: 'Aquí verás a los que fuiste.' },
};

// Fila de mobile-mis-eventos: fecha destacada, título, hora · lugar y estado con Badge
function MyEventItem({ event }) {
  const status = myEventStatus(event);
  const start = new Date(event.startsAt);
  return (
    <li>
      <Link
        to={`/eventos/${event.id}`}
        className="focus-ring flex items-start gap-3 rounded-[14px] border border-white/[0.06] bg-panel px-3.5 py-[13px] transition-colors hover:border-line"
      >
        <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[10px] bg-accent/12 text-[10.5px] leading-[1.2] font-bold text-accent-soft uppercase">
          <span>{dayFormatter.format(start)}</span>
          <span>{monthFormatter.format(start).replace('.', '')}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="mb-[3px] block text-[13.5px] font-semibold text-ink">{event.title}</span>
          <span className="block truncate text-[11.5px] text-ink-muted">
            {formatTime(event.startsAt)} · {event.location}
          </span>
        </span>
        <Badge tone={status.tone} className="shrink-0">
          {status.label}
        </Badge>
      </Link>
    </li>
  );
}

// Aviso naranja de mobile-mis-eventos: cambios sin leer en mis próximos eventos. Al abrirlo se marca leído.
function ScheduleChangeNotice({ notification }) {
  const markRead = useMarkNotificationRead();
  return (
    <li>
      <Link
        to={`/eventos/${notification.eventId}`}
        onClick={() => markRead.mutate(notification.id)}
        className="focus-ring mt-1 flex items-start gap-2.5 rounded-[14px] border border-action/25 bg-panel px-3.5 py-[13px]"
      >
        <AlertCircleIcon size={16} className="mt-px shrink-0 text-action" />
        <span>
          <span className="mb-0.5 block text-[12.5px] font-semibold text-action">Cambio de horario</span>
          <span className="block text-[11.5px] text-ink-muted">{notification.message || notification.subject}</span>
        </span>
      </Link>
    </li>
  );
}

export default function MisEventosPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'pasados' ? 'pasados' : 'proximos';
  const panelId = useId();
  const { data, isPending, isError, error, refetch } = useParticipantDashboard();
  const { data: inbox } = useNotifications();
  const current = TABS.find((t) => t.value === tab);
  const events = data?.[current.key] ?? [];
  const changes = tab === 'proximos' && data ? pendingScheduleChanges(inbox?.items ?? [], data.upcomingEvents) : [];

  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      <h1 className="pt-0.5 pb-3.5 font-display text-[21px] font-semibold text-ink md:text-[22px]">Mis eventos</h1>

      <div role="tablist" aria-label="Periodo" className="flex gap-2 pt-1.5 pb-4">
        {TABS.map(({ value, label, key }) => (
          <Chip
            key={value}
            role="tab"
            aria-controls={panelId}
            selected={tab === value}
            onClick={() => setParams(value === 'pasados' ? { tab: value } : {}, { replace: true })}
          >
            {label}
            {data && <span className="tabular-nums opacity-80">{data[key].length}</span>}
          </Chip>
        ))}
      </div>

      <div id={panelId} role="tabpanel" aria-label={current.label}>
        {isPending && (
          <div className="flex flex-col gap-3" aria-busy="true">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-[70px]" />
            ))}
          </div>
        )}
        {isError && <ErrorState message={error.message} onRetry={refetch} />}
        {!isPending && !isError && events.length === 0 && changes.length === 0 && (
          <EmptyState icon={CalendarIcon} {...EMPTY[tab]} />
        )}
        {!isPending && !isError && (events.length > 0 || changes.length > 0) && (
          <ul className="flex flex-col gap-3">
            {changes.map((n) => (
              <ScheduleChangeNotice key={n.id} notification={n} />
            ))}
            {events.map((event) => (
              <MyEventItem key={event.id} event={event} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
