import { Link } from 'react-router';
import { CalendarIcon, CheckIcon, ClockIcon, MapPinIcon } from '../icons/index.js';
import { endLabel } from '../../lib/event-time.js';
import { Badge, CapacityBar, Skeleton } from '../ui/index.js';
import { cn } from '../../lib/cn.js';
import { formatDate } from '../../lib/format.js';
import { formatDistance } from '../../lib/geo.js';
import { AttendanceButton } from './AttendanceButton.jsx';
import { AvatarStack } from './AvatarStack.jsx';
import { RatingBadge } from './RatingBadge.jsx';
import { EventCover } from './EventCover.jsx';
import { StatusBadges } from './EventBadges.jsx';

// Tarjeta de mobile-descubre / desktop-descubre: portada por categoría, título, fecha, lugar,
// cupo y acción. Sin distancia ni avatares (la API no trae asistentes por evento).
// El enlace al detalle y el botón de asistencia son hermanos: no se anidan controles interactivos.
// preview: vista previa del formulario de evento, sin enlace ni acciones reales (como la ve un participante)
// onOpen: se llama al abrir el detalle desde la tarjeta ("Para ti" lo usa para contar el clic de la prueba A/B)
export function EventCard({ event, reason, className, preview = false, priority = false, onOpen }) {
  const going = event.myAttendance?.status === 'confirmed';
  const Body = preview ? 'div' : Link;
  // La categoría viaja al detalle para que su pantalla de carga use el ícono animado de la categoría (P7)
  const bodyProps = preview ? {} : { to: `/eventos/${event.id}`, state: { category: event.category }, onClick: onOpen };
  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-card border border-white/[0.06] bg-panel transition-colors hover:border-line',
        className,
      )}
    >
      <Body {...bodyProps} className="focus-ring flex flex-1 flex-col rounded-card">
        <EventCover event={event} priority={priority} />
        <div className="flex flex-1 flex-col gap-2 px-3.5 pt-3 md:px-4 md:pt-3.5">
          {reason && <p className="text-[11.5px] font-semibold text-accent-soft">{reason}</p>}
          <h3 className="text-sm leading-snug font-semibold text-ink md:text-[14.5px]">{event.title}</h3>
          <p className="flex items-center gap-1.5 text-[11.5px] text-ink-muted md:text-xs">
            <CalendarIcon size={12} className="shrink-0 text-ink-faint" />
            <span className="first-letter:uppercase">{formatDate(event.startsAt)}</span>
          </p>
          {endLabel(event) && (
            <p className="flex items-center gap-1.5 text-[11.5px] text-ink-muted md:text-xs">
              <ClockIcon size={12} className="shrink-0 text-ink-faint" />
              <span>{endLabel(event)}</span>
            </p>
          )}
          <p className="flex items-center gap-1.5 text-[11.5px] text-ink-muted md:text-xs">
            <MapPinIcon size={12} className="shrink-0 text-ink-faint" />
            <span className="truncate">{event.location}</span>
            {Number.isFinite(event.distanceKm) && (
              <span className="shrink-0 font-semibold text-accent-soft">· {formatDistance(event.distanceKm)}</span>
            )}
          </p>
          {(going || event.status !== 'published' || event.isFull) && (
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadges event={event} />
              {going && (
                <Badge tone="success" icon={CheckIcon}>
                  Vas a ir
                </Badge>
              )}
              {!preview && <RatingBadge event={event} />}
            </div>
          )}
        </div>
      </Body>
      {!preview && event.confirmedPreview?.length > 0 && (
        <div className="px-3.5 pt-2.5 md:px-4">
          <AvatarStack people={event.confirmedPreview} total={event.confirmedCount} eventId={event.id} />
        </div>
      )}
      <div className="flex items-end gap-3 px-3.5 pt-2.5 pb-3.5 md:px-4 md:pb-4">
        <CapacityBar confirmedCount={event.confirmedCount} capacity={event.capacity} className="min-w-0 flex-1" />
        {preview ? (
          <span aria-hidden="true" className="inline-flex min-h-11 items-center rounded-lg bg-accent px-3.5 text-xs font-bold text-on-accent">
            Confirmar
          </span>
        ) : (
          <AttendanceButton event={event} compact />
        )}
      </div>
    </article>
  );
}

// Misma estructura y medidas que la tarjeta típica (portada, título, fecha, fin, lugar, avatares, cupo y botón) para que
// el cambio de skeleton a tarjeta no mueva la página. withReason: la línea de "Para ti" con la razón.
export function EventCardSkeleton({ className, withReason = false }) {
  return (
    <div className={cn('flex flex-col overflow-hidden rounded-card border border-white/[0.06] bg-panel', className)} aria-hidden="true">
      <div className="skeleton-sweep h-[84px] shrink-0 bg-field md:h-[108px]" />
      <div className="flex flex-col gap-2 px-3.5 pt-3 md:px-4 md:pt-3.5">
        {withReason && <Skeleton className="h-[17px] w-2/3 rounded-md" />}
        <Skeleton className="h-[19px] w-3/4 rounded-md md:h-5" />
        <Skeleton className="h-[17px] w-1/2 rounded-md md:h-4" />
        <Skeleton className="h-[17px] w-3/5 rounded-md md:h-4" />
        <Skeleton className="h-[17px] w-2/3 rounded-md md:h-4" />
      </div>
      <div className="px-3.5 pt-2.5 md:px-4">
        <Skeleton className="h-7 w-16 rounded-full" />
      </div>
      <div className="flex items-end gap-3 px-3.5 pt-2.5 pb-3.5 md:px-4 md:pb-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-[17px] w-2/3 rounded-md" />
          <Skeleton className="h-[7px] w-full rounded-full" />
          <Skeleton className="h-4 w-1/2 rounded-md" />
        </div>
        <Skeleton className="h-11 w-[92px] shrink-0 rounded-lg" />
      </div>
    </div>
  );
}
