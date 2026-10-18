import { useMemo } from 'react';
import { encodeQr } from '../../lib/qr.js';
import { qrPath, qrViewBoxSize } from '../../lib/qr-svg.js';
import { cn } from '../../lib/cn.js';

// QR en SVG: módulos oscuros (bg) sobre fondo claro (ink), como lo esperan los lectores, con 4 módulos
// de margen. crispEdges evita líneas finas entre módulos al escalar.
export function QrCode({ value, label, className }) {
  const qr = useMemo(() => encodeQr(value), [value]);
  const box = qrViewBoxSize(qr.size);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${box} ${box}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
      className={cn('block h-auto w-full', className)}
    >
      <rect width={box} height={box} className="fill-ink" />
      <path d={qrPath(qr.modules)} className="fill-bg" />
    </svg>
  );
}
