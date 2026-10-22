import 'leaflet/dist/leaflet.css';
import './map.css';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';
import { cn } from '../../lib/cn.js';
import { buildMapStyle } from '../../lib/mapStyle.js';
import {
  DEFAULT_ZOOM,
  MEDELLIN,
  OPENFREEMAP_ATTRIBUTION,
  TILES_ATTRIBUTION,
  TILES_MAX_ZOOM,
  TILES_URL,
  VECTOR_LOAD_TIMEOUT_MS,
  supportsWebGL2,
} from '../../lib/map.js';

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

// Mapa vectorial de OpenFreeMap con MapLibre GL, dentro de Leaflet (así los pines, popups y el selector de
// ubicación siguen siendo react-leaflet). MapLibre se descarga con import() dentro del chunk del mapa; si algo falla
// (sin WebGL2, error al cargar el estilo, tiempo agotado) avisa con onFail y MapBase cae al respaldo raster.
function VectorBasemap({ onReady, onFail }) {
  const map = useMap();

  useEffect(() => {
    let cancelled = false;
    let settled = false;
    let layer = null;
    let timer = null;

    const dropLayer = () => {
      if (!layer) return;
      try {
        map.removeLayer(layer);
      } catch {
        /* el lienzo ya no existe */
      }
      layer = null;
    };
    const fail = (reason) => {
      if (cancelled || settled) return;
      settled = true;
      clearTimeout(timer);
      console.warn('[mapa] El mapa vectorial no está disponible, uso el respaldo raster:', reason);
      dropLayer();
      onFail();
    };

    (async () => {
      if (!supportsWebGL2()) return fail('este dispositivo no tiene WebGL2');
      try {
        const [{ maplibreGL }] = await Promise.all([
          import('@maplibre/maplibre-gl-leaflet'),
          import('maplibre-gl/dist/maplibre-gl.css'),
        ]);
        if (cancelled) return;
        layer = maplibreGL({ style: buildMapStyle(), attributionControl: { customAttribution: OPENFREEMAP_ATTRIBUTION } });
        layer.addTo(map);
        const gl = layer.getMaplibreMap();
        // Un error de estilo, TileJSON o glifos rompe el mapa; un tile suelto que falla no (las teselas con error
        // llevan `tile`). Si la red cae del todo, `load` no llega y manda el tiempo de espera.
        gl.on('error', (event) => {
          if (settled) return;
          console.warn('[mapa] MapLibre:', event.error?.message ?? event, event.tile ? '(una tesela)' : '(estilo)');
          if (!event.tile) fail(event.error?.message ?? 'error al cargar el estilo');
        });
        gl.once('load', () => {
          if (cancelled || settled) return;
          settled = true;
          clearTimeout(timer);
          onReady();
        });
        timer = setTimeout(() => fail('el estilo tardó demasiado en cargar'), VECTOR_LOAD_TIMEOUT_MS);
      } catch (error) {
        fail(error?.message ?? 'no se pudo iniciar MapLibre');
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      dropLayer();
    };
    // onReady/onFail son setters estables de MapBase
  }, [map]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

// Mapa base de todos los mapas de la app. data-basemap = loading | vector | raster (el filtro oscuro de map.css solo
// aplica al respaldo raster). La atribución obligatoria queda siempre visible en cada modo.
// `isolate` (isolation: isolate) crea un contexto de apilamiento propio: los z-index internos de Leaflet y MapLibre
// (panes 200–700, controles 800–1000) quedan contenidos y no tapan modales, toasts, cabeceras ni la barra de acción.
export function MapBase({ center = MEDELLIN, zoom = DEFAULT_ZOOM, className, label, lockOnTouch = true, children }) {
  const coarse = useMediaQuery('(pointer: coarse)');
  const [unlocked, setUnlocked] = useState(false);
  const [basemap, setBasemap] = useState('loading');
  const locked = coarse && lockOnTouch && !unlocked;

  return (
    <div
      role="region"
      aria-label={label}
      data-basemap={basemap}
      className={cn('relative isolate overflow-hidden rounded-card border border-white/[0.06]', className)}
    >
      <MapContainer center={[center.lat, center.lng]} zoom={zoom} maxZoom={TILES_MAX_ZOOM} scrollWheelZoom={false} className="h-full w-full">
        {basemap === 'raster' ? (
          <TileLayer url={TILES_URL} attribution={TILES_ATTRIBUTION} maxZoom={TILES_MAX_ZOOM} />
        ) : (
          <VectorBasemap onReady={() => setBasemap('vector')} onFail={() => setBasemap('raster')} />
        )}
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
