import { lazy, Suspense } from 'react';
import { directionsLinks, hasCoordinates } from '../../lib/map.js';
import { ExternalLinkButton, Skeleton } from '../ui/index.js';
import { NavigationIcon } from '../icons/index.js';

// Leaflet pesa: el mapa se descarga solo cuando un evento con ubicación llega a pantalla
const MiniMap = lazy(() => import('../map/MiniMap.jsx'));

// Ubicación del detalle: mini mapa con el pin y "Cómo llegar" (Google Maps o Waze, solo un enlace).
// Si el evento no tiene coordenadas, no se muestra nada.
export function EventLocation({ event }) {
  if (!hasCoordinates(event)) return null;
  const links = directionsLinks({ lat: event.latitude, lng: event.longitude });
  return (
    <section aria-label="Ubicación en el mapa" className="mb-4">
      <Suspense fallback={<Skeleton className="h-44 md:h-52" />}>
        <MiniMap event={event} />
      </Suspense>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
          <NavigationIcon size={14} /> Cómo llegar
        </span>
        <ExternalLinkButton href={links.google} variant="secondary" size="sm">
          Google Maps
        </ExternalLinkButton>
        <ExternalLinkButton href={links.waze} variant="secondary" size="sm">
          Waze
        </ExternalLinkButton>
      </div>
    </section>
  );
}
