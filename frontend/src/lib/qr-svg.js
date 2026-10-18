// Convierte la matriz de lib/qr.js en un único <path> SVG: una franja por cada tramo horizontal de
// módulos oscuros. Deja `margin` módulos claros alrededor (zona de silencio; el estándar pide 4).
export const QR_MARGIN = 4;

export function qrViewBoxSize(size, margin = QR_MARGIN) {
  return size + margin * 2;
}

export function qrPath(modules, margin = QR_MARGIN) {
  const parts = [];
  modules.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (!row[x]) continue;
      const start = x;
      while (x + 1 < row.length && row[x + 1]) x++;
      const length = x - start + 1;
      parts.push(`M${start + margin} ${y + margin}h${length}v1h-${length}z`);
    }
  });
  return parts.join('');
}
