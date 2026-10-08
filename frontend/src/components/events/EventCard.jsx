import { Link } from 'react-router';
import { Check, MapPin } from 'lucide-react';
import { formatDate } from '../../lib/format.js';
import { AttendanceButton } from './AttendanceButton.jsx';
import { CapacityBar } from './CapacityBar.jsx';
import { CATEGORY_BORDERS, CategoryChip, StatusBadges } from './EventBadges.jsx';

// El enlace al detalle y el botón de asistencia son hermanos: no se anidan controles interactivos
export function EventCard({ event }) {
  const going = event.myAttendance?.status === 'confirmed';
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border-l-4 bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${CATEGORY_BORDERS[event.category]}`}
    >
      <Link
        to={`/eventos/${event.id}`}
        className="flex flex-col gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
      >
        <div className="flex flex-wrap items-center gap-2">
          <CategoryChip category={event.category} />
          <StatusBadges event={event} />
          {going && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-semibold text-navy-900">
              <Check size={12} aria-hidden="true" /> Vas a ir
            </span>
          )}
        </div>
        <h2 className="font-display text-lg font-semibold leading-snug text-navy-900">{event.title}</h2>
        <div className="flex flex-col gap-1 text-sm text-gray-500">
          <p className="capitalize">{formatDate(event.startsAt)}</p>
          <p className="flex items-center gap-1">
            <MapPin size={14} aria-hidden="true" />
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
  return <div aria-hidden="true" className="h-48 animate-pulse rounded-2xl bg-gray-200" />;
}
