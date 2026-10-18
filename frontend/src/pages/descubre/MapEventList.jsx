import { Link } from 'react-router';
import { formatDate } from '../../lib/format.js';
import { formatDistance } from '../../lib/geo.js';
import { hasCoordinates } from '../../lib/map.js';

// Lo mismo que muestra el mapa, como lista: sirve a quien no usa el mapa (lector de pantalla, teclado)
// e incluye los eventos que no tienen ubicación marcada.
export function MapEventList({ events, selectedId, onSelect }) {
  return (
    <ul className="mt-4 divide-y divide-line overflow-hidden rounded-card border border-line bg-panel">
      {events.map((event) => (
        <li key={event.id} className={selectedId === event.id ? 'bg-field' : undefined}>
          <div className="flex items-center justify-between gap-3 px-4 py-2.5">
            <div className="min-w-0">
              <Link to={`/eventos/${event.id}`} className="focus-ring block truncate rounded text-[13.5px] font-semibold text-ink">
                {event.title}
              </Link>
              <p className="truncate text-xs text-ink-muted">
                <span className="first-letter:uppercase">{formatDate(event.startsAt)}</span>
                {Number.isFinite(event.distanceKm) && ` · ${formatDistance(event.distanceKm)}`}
                {!hasCoordinates(event) && ' · sin ubicación en el mapa'}
              </p>
            </div>
            {onSelect && hasCoordinates(event) && (
              <button
                type="button"
                onClick={() => onSelect(event.id)}
                className="focus-ring min-h-11 shrink-0 rounded px-2 text-xs font-semibold text-accent hover:text-accent-soft"
                aria-label={`Ver ${event.title} en el mapa`}
              >
                Ver en el mapa
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
