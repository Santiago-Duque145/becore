import { Link } from 'react-router';
import { CheckIcon, MapPinIcon } from '../icons/index.js';
import { Badge, CapacityBar, Skeleton } from '../ui/index.js';
import { formatDate } from '../../lib/format.js';
import { AttendanceButton } from './AttendanceButton.jsx';
import { CATEGORY_BORDERS, CategoryChip, StatusBadges } from './EventBadges.jsx';

// El enlace al detalle y el botón de asistencia son hermanos: no se anidan controles interactivos
export function EventCard({ event }) {
  const going = event.myAttendance?.status === 'confirmed';
  return (
    <div
      className={`flex flex-col gap-3 rounded-card border border-l-4 border-line bg-panel p-4 transition-colors hover:border-ink-faint ${CATEGORY_BORDERS[event.category]}`}
    >
      <Link to={`/eventos/${event.id}`} className="focus-ring flex flex-col gap-3 rounded-field">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryChip category={event.category} />
          <StatusBadges event={event} />
          {going && (
            <Badge tone="success" icon={CheckIcon}>
              Vas a ir
            </Badge>
          )}
        </div>
        <h2 className="text-[14.5px] leading-snug font-semibold text-ink">{event.title}</h2>
        <div className="flex flex-col gap-1 text-xs text-ink-muted">
          <p className="capitalize">{formatDate(event.startsAt)}</p>
          <p className="flex items-center gap-1">
            <MapPinIcon size={14} />
            <span>{event.location}</span>
          </p>
        </div>
        <CapacityBar confirmedCount={event.confirmedCount} capacity={event.capacity} />
      </Link>
      <AttendanceButton event={event} compact />
    </div>
  );
}

export function EventCardSkeleton() {
  return <Skeleton className="h-48" />;
}
