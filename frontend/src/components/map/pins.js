import L from 'leaflet';
import { pinColor } from '../../lib/map.js';

// Íconos de Leaflet sin imágenes (los PNG por defecto se rompen con Vite): HTML + CSS en map.css.
// El color sale de los tokens del tema por categoría.
export function eventPinIcon(category, selected = false) {
  return L.divIcon({
    className: '',
    html: `<span class="becore-pin" data-selected="${selected}" style="--pin:${pinColor(category)}"></span>`,
    iconSize: [28, 36],
    iconAnchor: [14, 34],
    popupAnchor: [0, -32],
  });
}

export const userDotIcon = L.divIcon({
  className: '',
  html: '<span class="becore-user"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Pin del selector de ubicación (un solo pin turquesa)
export const pickerIcon = eventPinIcon('sport', true);
