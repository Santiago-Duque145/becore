import { Link } from 'react-router';
import { Badge } from '../ui/index.js';
import { capacityState } from '../ui/CapacityBar.jsx';
import { cn } from '../../lib/cn.js';
import { capacityText } from '../../lib/capacity.js';
import { formatDate } from '../../lib/format.js';
import { FinishEventButton } from '../events/FinishEventButton.jsx';
import { CATEGORY_STYLE, canEditEvent, eventRowStatus } from './organizer-ui.js';

const BAR_COLOR = { open: 'bg-accent', almost_full: 'bg-action', full: 'bg-ink-faint' };

function CategoryBox({ category }) {
  const { Icon, box } = CATEGORY_STYLE[category] ?? CATEGORY_STYLE.other;
  return (
    <span
      className={cn(
        'flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px]',
        box,
      )}
      aria-hidden="true"
    >
      <Icon size={16} />
    </span>
  );
}

// Barra corta de la tabla (120 px) con "Confirmados 24 de 40" y los cupos disponibles debajo
function MiniCapacity({ event }) {
  const text = capacityText(event.confirmedCount, event.capacity);
  const percent =
    event.capacity > 0 ? Math.min((event.confirmedCount / event.capacity) * 100, 100) : 0;
  return (
    <div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={event.capacity}
        aria-valuenow={Math.min(event.confirmedCount, event.capacity)}
        aria-label={`${text.confirmed}. ${text.available}`}
        className="h-1.5 w-[120px] overflow-hidden rounded-full bg-line"
      >
        <div
          className={cn(
            'h-full rounded-full',
            BAR_COLOR[capacityState(event.confirmedCount, event.capacity)],
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] font-semibold text-ink tabular-nums">{text.confirmed}</p>
      <p className="text-[11px] text-ink-muted">{text.available}</p>
    </div>
  );
}

function RowAction({ event }) {
  if (event.status === 'in_progress') return <FinishEventButton event={event} size="sm" variant="secondary" />;
  const editable = canEditEvent(event);
  return (
    <Link
      to={editable ? `/eventos/${event.id}/editar` : `/eventos/${event.id}`}
      className="focus-ring inline-flex min-h-11 items-center rounded px-2 text-[13px] font-semibold text-ink-muted hover:text-accent-soft"
      aria-label={`${editable ? 'Editar' : 'Ver'} ${event.title}`}
    >
      {editable ? 'Editar' : 'Ver'}
    </Link>
  );
}

// Escritorio: tabla del mockup (Evento, Fecha, Cupo, Estado, acción)
export function OrganizerEventsTable({ events }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr className="text-left text-[11px] tracking-[0.04em] text-ink-muted uppercase">
            <th scope="col" className="px-[22px] py-3 font-semibold">
              Evento
            </th>
            <th scope="col" className="px-[22px] py-3 font-semibold">
              Fecha
            </th>
            <th scope="col" className="px-[22px] py-3 font-semibold">
              Cupo
            </th>
            <th scope="col" className="px-[22px] py-3 font-semibold">
              Estado
            </th>
            <th scope="col" className="px-[22px] py-3">
              <span className="sr-only">Acción</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const [label, tone] = eventRowStatus(event);
            return (
              <tr key={event.id} className="border-t border-white/5 text-[13.5px]">
                <td className="px-[22px] py-3.5">
                  <div className="flex items-center gap-3">
                    <CategoryBox category={event.category} />
                    <div className="min-w-0">
                      <Link
                        to={`/eventos/${event.id}`}
                        className="focus-ring hit-area rounded font-semibold text-ink hover:text-accent-soft"
                      >
                        {event.title}
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-ink-muted">{event.location}</p>
                    </div>
                  </div>
                </td>
                <td className="min-w-[140px] px-[22px] py-3.5 text-ink first-letter:uppercase">
                  {formatDate(event.startsAt)}
                </td>
                <td className="px-[22px] py-3.5">
                  <MiniCapacity event={event} />
                </td>
                <td className="px-[22px] py-3.5">
                  <Badge tone={tone}>{label}</Badge>
                </td>
                <td className="px-[22px] py-3.5 text-right">
                  <RowAction event={event} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Móvil: la tabla pasa a tarjetas
export function OrganizerEventsCards({ events }) {
  return (
    <ul className="flex flex-col divide-y divide-white/5">
      {events.map((event) => {
        const [label, tone] = eventRowStatus(event);
        return (
          <li key={event.id} className="flex flex-col gap-3 px-4 py-3.5">
            <div className="flex items-start gap-3">
              <CategoryBox category={event.category} />
              <div className="min-w-0 flex-1">
                <Link
                  to={`/eventos/${event.id}`}
                  className="focus-ring hit-area rounded text-[13.5px] font-semibold text-ink"
                >
                  {event.title}
                </Link>
                <p className="mt-0.5 text-xs text-ink-muted first-letter:uppercase">
                  {formatDate(event.startsAt)}
                </p>
              </div>
              <Badge tone={tone} className="shrink-0">
                {label}
              </Badge>
            </div>
            <div className="flex items-end justify-between gap-3 pl-[46px]">
              <MiniCapacity event={event} />
              <RowAction event={event} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
