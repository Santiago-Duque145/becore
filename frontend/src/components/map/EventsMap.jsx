import { useEffect, useMemo, useRef } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router';
import { capacityText } from '../../lib/capacity.js';
import { formatDate } from '../../lib/format.js';
import { formatDistance } from '../../lib/geo.js';
import { boundsOf, eventPoint, hasCoordinates } from '../../lib/map.js';
import { LinkButton } from '../ui/index.js';
import { CardHighlight } from '../events/CardHighlight.jsx';
import { MapBase } from './MapBase.jsx';
import { eventPinIcon, userDotIcon } from './pins.js';

// Encuadra los eventos (y a la persona, si dio su ubicación) cuando cambian los puntos, no en cada actualización de cupo
function FitToPoints({ points }) {
  const map = useMap();
  const bounds = boundsOf(points);
  const key = JSON.stringify(bounds);
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
    // `key` resume `bounds`: así no se reencuadra mientras alguien mueve el mapa
  }, [key, map]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// Vuela hasta el evento elegido en la lista y abre su ficha
function FlyToSelected({ event, markerRefs }) {
  const map = useMap();
  useEffect(() => {
    if (!event || !hasCoordinates(event)) return;
    map.flyTo([event.latitude, event.longitude], Math.max(map.getZoom(), 14), { duration: 0.6 });
    markerRefs.current[event.id]?.openPopup();
  }, [event?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// Ficha del pin: título, fecha, cupo con el mismo texto de tarjetas y panel, y botón al detalle
export function EventPopupCard({ event }) {
  const text = capacityText(event.confirmedCount, event.capacity);
  return (
    <div className="flex min-w-[210px] flex-col gap-1.5">
      <Link to={`/eventos/${event.id}`} className="focus-ring rounded text-sm leading-snug font-semibold !text-ink">
        {event.title}
      </Link>
      <CardHighlight event={event} className="self-start" />
      <p className="text-xs !text-ink-muted first-letter:uppercase">{formatDate(event.startsAt)}</p>
      {Number.isFinite(event.distanceKm) && <p className="text-xs !text-ink-muted">{formatDistance(event.distanceKm)}</p>}
      <p className="text-xs !text-ink">
        <span className="font-semibold">{text.confirmed}</span> · {text.available}
      </p>
      <LinkButton to={`/eventos/${event.id}`} size="sm" className="mt-1 !text-on-accent">
        Ver evento
      </LinkButton>
    </div>
  );
}

// Mapa de eventos (Descubre y "Mapa en vivo"): un pin por evento con ubicación, del color de su categoría.
// Cada pin tiene nombre accesible (title) y se activa con el teclado. selectedId resalta y abre un evento.
export function EventsMap({ events, userPosition, selectedId, onSelect, className, label = 'Mapa de eventos' }) {
  const markerRefs = useRef({});
  const located = useMemo(() => events.filter(hasCoordinates), [events]);
  const points = useMemo(() => [...located.map(eventPoint), ...(userPosition ? [userPosition] : [])], [located, userPosition]);
  const selected = located.find((e) => e.id === selectedId);

  return (
    <MapBase className={className} label={label}>
      <FitToPoints points={points} />
      <FlyToSelected event={selected} markerRefs={markerRefs} />
      {located.map((event) => (
        <Marker
          key={event.id}
          ref={(marker) => {
            markerRefs.current[event.id] = marker;
          }}
          position={[event.latitude, event.longitude]}
          icon={eventPinIcon(event.category, event.id === selectedId)}
          title={`${event.title}, ${formatDate(event.startsAt)}`}
          eventHandlers={{ click: () => onSelect?.(event.id) }}
        >
          <Popup>
            <EventPopupCard event={event} />
          </Popup>
        </Marker>
      ))}
      {userPosition && <Marker position={[userPosition.lat, userPosition.lng]} icon={userDotIcon} title="Tú estás aquí" zIndexOffset={1000} />}
    </MapBase>
  );
}
