// Fondo animado del hero de auth (P1): "líneas de movimiento" diagonales con los colores de la marca que se
// desplazan suave y una red de puntos que se conectan en bucle. Solo SVG + CSS, decorativo (aria-hidden), con
// opacidad baja para no competir con el logo. Todo vive en los costados (x < 120 o x > 280) y por encima del
// tagline (y < 200) del viewBox de 390 × 300, para no cruzar el logo, el tagline ni el dato en vivo; en escritorio
// (hero de 240 px, slice) se recorta arriba y abajo, por eso nada pasa de y = 40 ni de y = 196.
// Con prefers-reduced-motion queda quieto (motion-reduce:animate-none): barras en su sitio y líneas dibujadas.

const BARS = [
  // Costado izquierdo, abajo
  { group: 0, color: 'var(--color-culture)', x1: 14, y1: 140, x2: 48, y2: 116 },
  { group: 0, color: 'var(--color-accent)', x1: 20, y1: 176, x2: 94, y2: 124 },
  { group: 0, color: 'var(--color-success)', x1: 48, y1: 190, x2: 116, y2: 142 },
  { group: 0, color: 'var(--color-action)', x1: 78, y1: 194, x2: 108, y2: 173 },
  // Costado derecho, arriba
  { group: 1, color: 'var(--color-action)', x1: 282, y1: 82, x2: 322, y2: 54 },
  { group: 1, color: 'var(--color-accent)', x1: 294, y1: 104, x2: 370, y2: 50 },
  { group: 1, color: 'var(--color-culture)', x1: 318, y1: 118, x2: 376, y2: 77 },
  { group: 1, color: 'var(--color-success)', x1: 338, y1: 128, x2: 386, y2: 94 },
];

const POINTS = [
  [28, 50], [70, 42], [98, 80], [46, 94], // costado izquierdo, arriba
  [300, 152], [344, 140], [372, 178], [318, 190], // costado derecho, abajo
];

const LINKS = [
  [0, 1], [1, 2], [0, 3], [3, 2],
  [4, 5], [5, 6], [4, 7], [7, 6],
];

// Las dos esquinas se mueven en contrafase; cada enlace arranca en un punto distinto del ciclo
const GROUP_DELAYS = ['0s', '-5s'];

export function HeroMotion() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 390 300"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <g opacity="0.32" strokeLinecap="round" strokeWidth="5">
        {GROUP_DELAYS.map((delay, group) => (
          <g key={group} className="animate-hero-drift motion-reduce:animate-none" style={{ animationDelay: delay }}>
            {BARS.filter((bar) => bar.group === group).map(({ color, x1, y1, x2, y2 }) => (
              <line key={`${x1}-${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} />
            ))}
          </g>
        ))}
      </g>
      <g opacity="0.45" stroke="var(--color-accent-soft)" strokeWidth="1">
        {LINKS.map(([a, b], i) => (
          <line
            key={`${a}-${b}`}
            x1={POINTS[a][0]}
            y1={POINTS[a][1]}
            x2={POINTS[b][0]}
            y2={POINTS[b][1]}
            pathLength="1"
            strokeDasharray="1"
            className="animate-hero-link motion-reduce:animate-none"
            style={{ animationDelay: `${-i * 1.4}s` }}
          />
        ))}
      </g>
      <g opacity="0.6" fill="var(--color-accent-soft)">
        {POINTS.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.2" />
        ))}
      </g>
    </svg>
  );
}
