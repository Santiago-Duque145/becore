import { useEffect, useState } from 'react';
import { cropRect } from '../lib/crop.js';

// P8 · Vista previa en vivo del recorte: cada 150 ms sin cambios dibuja lo que quedó en el marco en un canvas pequeño
// y lo entrega como data URL, para mostrarlo con los mismos componentes de la tarjeta y del detalle.
export function useCropPreview(image, state, { width, height }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!image || !state) return undefined;
    const timer = setTimeout(() => {
      const rect = cropRect(state);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(image, rect.x, rect.y, rect.width, rect.height, 0, 0, width, height);
      try {
        setUrl(canvas.toDataURL('image/jpeg', 0.8));
      } catch {
        setUrl(null); // imagen de otro origen sin CORS: sin vista previa, el editor sigue sirviendo
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [image, state, width, height]);
  return url;
}
