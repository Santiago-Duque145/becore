import { Marker } from 'react-leaflet';
import { PIN_ZOOM } from '../../lib/map.js';
import { MapBase } from './MapBase.jsx';
import { eventPinIcon } from './pins.js';

// Mini mapa del detalle del evento: un pin, sin ficha. En móvil no se mueve hasta tocar "Mover el mapa",
// para no atrapar el scroll de la página.
export default function MiniMap({ event }) {
  return (
    <MapBase center={{ lat: event.latitude, lng: event.longitude }} zoom={PIN_ZOOM} className="h-44 md:h-52" label={`Mapa del lugar: ${event.location}`}>
      <Marker position={[event.latitude, event.longitude]} icon={eventPinIcon(event.category, true)} title={event.location} keyboard={false} />
    </MapBase>
  );
}
