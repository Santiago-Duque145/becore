import 'leaflet/dist/leaflet.css';
import './map.css';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';
import { cn } from '../../lib/cn.js';
import {
  DEFAULT_ZOOM,
  FALLBACK_ATTRIBUTION,
  FALLBACK_TILES_URL,
  MEDELLIN,
  TILES_ATTRIBUTION,
  tilesUrl,
} from '../../lib/map.js';

const TILE_ERRORS_BEFORE_FALLBACK = 4;

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

// Mapa base: teselas oscuras (VITE_MAP_TILES_URL) con respaldo al mapa estándar de OpenStreetMap si fallan,
// y la atribución obligatoria siempre visible.
export function MapBase({ center = MEDELLIN, zoom = DEFAULT_ZOOM, className, label, lockOnTouch = true, children }) {
  const coarse = useMediaQuery('(pointer: coarse)');
  const [unlocked, setUnlocked] = useState(false);
  const [tileErrors, setTileErrors] = useState(0);
  const configured = tilesUrl(import.meta.env.VITE_MAP_TILES_URL);
  const useFallback = tileErrors >= TILE_ERRORS_BEFORE_FALLBACK && configured !== FALLBACK_TILES_URL;
  const locked = coarse && lockOnTouch && !unlocked;

  return (
    <div role="region" aria-label={label} className={cn('relative overflow-hidden rounded-card border border-white/[0.06]', className)}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          key={useFallback ? 'osm' : 'main'}
          url={useFallback ? FALLBACK_TILES_URL : configured}
          attribution={useFallback ? FALLBACK_ATTRIBUTION : TILES_ATTRIBUTION}
          eventHandlers={{ tileerror: () => setTileErrors((n) => n + 1) }}
        />
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
