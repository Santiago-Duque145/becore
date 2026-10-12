import { Link } from 'react-router';
import { CalendarIcon, CheckIcon, MapPinIcon } from '../icons/index.js';
import { Badge, CapacityBar, Skeleton } from '../ui/index.js';
import { cn } from '../../lib/cn.js';
import { formatDate } from '../../lib/format.js';
import { AttendanceButton } from './AttendanceButton.jsx';
import { EventCover } from './EventCover.jsx';
import { StatusBadges } from './EventBadges.jsx';

// Tarjeta de mobile-descubre / desktop-descubre: portada por categoría, título, fecha, lugar,
// cupo y acción. Sin distancia ni avatares (la API no trae asistentes por evento).
// El enlace al detalle y el botón de asistencia son hermanos: no se anidan controles interactivos.
export function EventCard({ event, reason, className }) {
  const going = event.myAttendance?.status === 'confirmed';
  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-card border border-white/[0.06] bg-panel transition-colors hover:border-line',
        className,
      )}
    >
      <Link to={`/eventos/${event.id}`} className="focus-ring flex flex-1 flex-col rounded-card">
        <EventCover event={event} />
        <div className="flex flex-1 flex-col gap-2 px-3.5 pt-3 md:px-4 md:pt-3.5">
          {reason && <p className="text-[11.5px] font-semibold text-accent-soft">{reason}</p>}
          <h3 className="text-sm leading-snug font-semibold text-ink md:text-[14.5px]">{event.title}</h3>
          <p className="flex items-center gap-1.5 text-[11.5px] text-ink-muted md:text-xs">
            <CalendarIcon size={12} className="shrink-0 text-ink-faint" />
            <span className="first-letter:uppercase">{formatDate(event.startsAt)}</span>
          </p>
          <p className="flex items-center gap-1.5 text-[11.5px] text-ink-muted md:text-xs">
            <MapPinIcon size={12} className="shrink-0 text-ink-faint" />
            <span className="truncate">{event.location}</span>
          </p>
          {(going || event.status !== 'published' || event.isFull) && (
            <div className="flex flex-wrap gap-1.5">
              <StatusBadges event={event} />
              {going && (
                <Badge tone="success" icon={CheckIcon}>
                  Vas a ir
                </Badge>
              )}
            </div>
          )}
        </div>
      </Link>
      <div className="flex items-end gap-3 px-3.5 pt-2.5 pb-3.5 md:px-4 md:pb-4">
        <CapacityBar confirmedCount={event.confirmedCount} capacity={event.capacity} className="min-w-0 flex-1" />
        <AttendanceButton event={event} compact />
      </div>
    </article>
  );
}

export function EventCardSkeleton({ className }) {
  return (
    <div className={cn('overflow-hidden rounded-card border border-white/[0.06] bg-panel', className)} aria-hidden="true">
      <div className="h-[84px] animate-pulse bg-field motion-reduce:animate-none md:h-[108px]" />
      <div className="flex flex-col gap-2.5 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="mt-1 h-7 w-full" />
      </div>
    </div>
  );
}
