import { createPortal } from 'react-dom';

// Overlays (diálogos, vista previa de avatar, toasts) directamente en <body>: así ninguna página los encierra en su
// contexto de apilamiento ni los tapa (p. ej. los paneles de Leaflet de un mapa, z-index 400–1000).
export function BodyPortal({ children }) {
  return createPortal(children, document.body);
}
