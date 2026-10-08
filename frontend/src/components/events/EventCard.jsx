import { Link } from 'react-router';
import { MapPin } from 'lucide-react';
import { formatDate } from '../../lib/format.js';
import { CapacityBar } from './CapacityBar.jsx';
import { CATEGORY_BORDERS, CategoryChip, StatusBadges } from './EventBadges.jsx';

export function EventCard({ event }) {
  return (
    <Link
      to={`/eventos/${event.id}`}
      className={`flex flex-col gap-3 rounded-2xl border-l-4 bg-white p-4 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 ${CATEGORY_BORDERS[event.category]}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <CategoryChip category={event.category} />
        <StatusBadges event={event} />
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
  );
}

export function EventCardSkeleton() {
  return <div aria-hidden="true" className="h-48 animate-pulse rounded-2xl bg-gray-200" />;
}
