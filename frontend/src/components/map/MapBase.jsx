import 'leaflet/dist/leaflet.css';
import './map.css';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';
import { cn } from '../../lib/cn.js';
import { DEFAULT_ZOOM, MEDELLIN, TILES_ATTRIBUTION, TILES_MAX_ZOOM, TILES_URL } from '../../lib/map.js';

// Con el dedo, un mapa grande se traga el scroll de la página. En pantallas táctiles el mapa empieza "bloqueado"
// (arrastrar desplaza la página) y un botón lo activa. La rueda del mouse nunca hace zoom: están los botones +/-.
function InteractionLock({ locked }) {
  const map = useMap();
  useEffect(() => {
    const handlers = [map.dragging, map.touchZoom, map.doubleClickZoom];
    handlers.forEach((handler) => (locked ? handler.disable() : handler.enable()));
  }, [locked, map]);
  return null;
}

// Mapa base: teselas de OpenStreetMap (oscurecidas con CSS en map.css) y la atribución obligatoria siempre visible.
export function MapBase({ center = MEDELLIN, zoom = DEFAULT_ZOOM, className, label, lockOnTouch = true, children }) {
  const coarse = useMediaQuery('(pointer: coarse)');
  const [unlocked, setUnlocked] = useState(false);
  const locked = coarse && lockOnTouch && !unlocked;

  return (
    <div role="region" aria-label={label} className={cn('relative overflow-hidden rounded-card border border-white/[0.06]', className)}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer url={TILES_URL} attribution={TILES_ATTRIBUTION} maxZoom={TILES_MAX_ZOOM} />
        <InteractionLock locked={locked} />
        {children}
      </MapContainer>

      {coarse && lockOnTouch && (
        <button
          type="button"
          aria-pressed={unlocked}
          onClick={() => setUnlocked((value) => !value)}
          className="focus-ring absolute top-2.5 right-2.5 z-[500] min-h-9 rounded-full border border-line bg-panel/90 px-3.5 text-xs font-semibold text-ink backdrop-blur-sm"
        >
          {unlocked ? 'Listo, volver a la página' : 'Mover el mapa'}
        </button>
      )}
    </div>
  );
}
