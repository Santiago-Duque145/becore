import { useEffect, useState } from 'react';
import { Marker, useMap, useMapEvents } from 'react-leaflet';
import { DEFAULT_ZOOM, MEDELLIN, PIN_ZOOM } from '../../lib/map.js';
import { searchPlaces } from '../../services/geocode.api.js';
import { SearchIcon } from '../icons/index.js';
import { Button, Input } from '../ui/index.js';
import { MapBase } from './MapBase.jsx';
import { pickerIcon } from './pins.js';

const round = (n) => Math.round(n * 1e6) / 1e6; // 6 decimales ≈ 11 cm, igual que numeric(9,6)

// Clic en el mapa pone el pin; si hay pin, el mapa se centra en él al cambiar desde fuera (búsqueda)
function ClickToPlace({ onChange }) {
  useMapEvents({ click: (event) => onChange({ lat: round(event.latlng.lat), lng: round(event.latlng.lng) }) });
  return null;
}

function Recenter({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), PIN_ZOOM), { duration: 0.5 });
  }, [target, map]);
  return null;
}

// Selector de ubicación del formulario de evento (opcional): clic o arrastrar el pin, o buscar una dirección.
// value = { lat, lng } | null. Las coordenadas son un complemento del texto del lugar, nunca lo reemplazan.
export default function LocationPicker({ value, onChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null); // null = aún no buscó
  const [status, setStatus] = useState('idle'); // idle | searching | error
  const [flyTarget, setFlyTarget] = useState(null);
  const [message, setMessage] = useState('');

  async function search() {
    const q = query.trim();
    if (q.length < 3) {
      setMessage('Escribe al menos 3 caracteres.');
      return;
    }
    setStatus('searching');
    setMessage('');
    try {
      const { data } = await searchPlaces(q);
      setResults(data);
      setStatus('idle');
      if (!data.length) setMessage('No encontramos esa dirección. Marca el lugar directamente en el mapa.');
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
    }
  }

  function choose(place) {
    const point = { lat: round(place.lat), lng: round(place.lng) };
    onChange(point);
    setFlyTarget({ ...point });
    setResults(null);
  }

  return (
    <div className="mb-4">
      <span className="mb-[7px] block text-xs font-semibold text-ink-muted">Ubicación en el mapa (opcional)</span>

      {/* No es un <form>: este selector vive dentro del formulario del evento */}
      <div className="mb-2.5 flex gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor="place-search" className="sr-only">
            Buscar una dirección
          </label>
          <Input
            id="place-search"
            type="search"
            icon={SearchIcon}
            placeholder="Buscar una dirección o un lugar"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                search();
              }
            }}
          />
        </div>
        <Button variant="secondary" loading={status === 'searching'} onClick={search} className="shrink-0">
          Buscar
        </Button>
      </div>

      <div aria-live="polite">
        {message && <p className="mb-2 text-xs text-ink-muted">{message}</p>}
        {results?.length > 0 && (
          <ul className="mb-2.5 overflow-hidden rounded-field border border-line bg-field">
            {results.map((place, index) => (
              <li key={index} className="border-b border-line last:border-b-0">
                <button type="button" onClick={() => choose(place)} className="focus-ring min-h-11 w-full px-3.5 py-2 text-left text-[13px] text-ink hover:bg-panel">
                  {place.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <MapBase
        center={value ?? MEDELLIN}
        zoom={value ? PIN_ZOOM : DEFAULT_ZOOM}
        className="h-64 md:h-72"
        label="Mapa para marcar el lugar del evento. Toca el mapa para poner el pin."
      >
        <ClickToPlace onChange={onChange} />
        <Recenter target={flyTarget} />
        {value && (
          <Marker
            position={[value.lat, value.lng]}
            icon={pickerIcon}
            draggable
            title="Lugar del evento. Arrástralo para ajustarlo."
            eventHandlers={{
              dragend: (event) => {
                const { lat, lng } = event.target.getLatLng();
                onChange({ lat: round(lat), lng: round(lng) });
              },
            }}
          />
        )}
      </MapBase>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ink-muted">
          {value ? `Pin en ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}` : 'Toca el mapa para poner el pin. Si no lo marcas, solo se muestra el texto del lugar.'}
        </p>
        {value && (
          <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
            Quitar ubicación
          </Button>
        )}
      </div>
    </div>
  );
}
