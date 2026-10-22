import L from 'leaflet';
import { PIN_SIZE, pinSvg } from '../../lib/pin-svg.js';

// Íconos de Leaflet sin imágenes: la gota SVG de lib/pin-svg.js y el punto "Tú estás aquí" (estilos en map.css).
export function eventPinIcon(category, selected = false) {
  const [w, h] = PIN_SIZE[selected ? 'selected' : 'normal'];
  return L.divIcon({
    className: 'becore-pin-icon',
    html: pinSvg(category, selected),
    iconSize: [w, h],
    iconAnchor: [w / 2, h - 2], // la punta de la gota queda sobre el punto del mapa
    popupAnchor: [0, -h + 6],
  });
}

export const userDotIcon = L.divIcon({
  className: '',
  html: '<span class="becore-user"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Pin del selector de ubicación (turquesa, como el de deporte)
export const pickerIcon = eventPinIcon('sport', true);
