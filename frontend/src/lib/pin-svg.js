import { pinColor } from './map.js';

// Pin de los mapas: la gota SVG del mockup (.mt-pin de desktop-panel-organizador.html, viewBox 34×44) con el color de
// su categoría —los mismos de las insignias de las tarjetas— y un borde oscuro sutil para que se vea sobre el fondo del
// mapa. Es el mismo en Descubre, detalle, selector de ubicación y Mapa en vivo. Va aparte de pins.js (que usa Leaflet)
// para poder probarlo sin navegador.
export const PIN_PATH = 'M17 0C7.6 0 0 7.6 0 17c0 12.7 17 27 17 27s17-14.3 17-27C34 7.6 26.4 0 17 0z';
export const PIN_STROKE = 'rgba(11,20,32,0.85)';

export const PIN_SIZE = { normal: [26, 34], selected: [34, 44] };

export function pinSvg(category, selected = false) {
  const [w, h] = PIN_SIZE[selected ? 'selected' : 'normal'];
  const stroke = selected ? 'var(--color-ink)' : PIN_STROKE;
  return `<svg class="becore-pin" data-selected="${selected}" width="${w}" height="${h}" viewBox="-2 -2 38 48" fill="none" aria-hidden="true" focusable="false"><path d="${PIN_PATH}" fill="${pinColor(category)}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/></svg>`;
}
