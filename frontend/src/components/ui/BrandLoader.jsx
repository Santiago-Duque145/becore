import { forwardRef, useId } from 'react';
import { LOADING_PHRASES } from '../../constants/loading.js';
import { usePhraseIndex } from '../../hooks/useLoaderTiming.js';
import { cn } from '../../lib/cn.js';
import { BallIcon, MusicIcon, SparklesIcon, TreeIcon } from '../icons/index.js';

// P7 · Loader de la marca: el isotipo del BrandMark animado (SVG + CSS, sin librerías) y frases que rotan debajo.
// - La "B" se dibuja con trazo y se rellena; las líneas de movimiento (turquesa, verde, naranja, amarillo) pasan por
//   detrás y tres puntos se conectan como comunidad. Bucle de 1,8 s (keyframes loader-* en index.css).
// - category: en lugar de la "B", el ícono animado de la categoría del evento.
// - Lector de pantalla: role="status" anuncia una sola vez `label` ("Cargando"); las frases son aria-hidden.
// - Con prefers-reduced-motion: logo quieto y frases sin fundido.
const SIZES = { sm: 32, md: 52, lg: 72 };

const STREAKS = [
  { y: 11, color: 'var(--color-accent)', delay: '0s' },
  { y: 16, color: 'var(--color-success)', delay: '0.12s' },
  { y: 21, color: 'var(--color-action)', delay: '0.24s' },
  { y: 26, color: 'var(--color-culture)', delay: '0.36s' },
];
const DOTS = [
  { cx: 28.5, cy: 10, delay: '0s' },
  { cx: 30.5, cy: 17, delay: '0.12s' },
  { cx: 28.5, cy: 24, delay: '0.24s' },
];
const B_PATH = 'M10 24 L10 10 Q10 8 12 8 L18 8 Q23 8 23 12.5 Q23 16 19 17 Q24 18 24 22.5 Q24 27 18 27 L12 27 Q10 27 10 25 Z';
const still = 'motion-reduce:animate-none';

function BrandGlyph({ px }) {
  const id = useId();
  return (
    <svg width={px} height={px} viewBox="0 0 34 34" fill="none" aria-hidden="true" focusable="false" data-loader="brand">
      <defs>
        <linearGradient id={`${id}g`} x1="10" y1="8" x2="24" y2="27" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--color-accent)" />
          <stop offset="1" stopColor="white" />
        </linearGradient>
        <clipPath id={`${id}c`}>
          <rect width="34" height="34" rx="9" />
        </clipPath>
      </defs>
      <rect width="34" height="34" rx="9" fill="var(--color-bg-deep)" />
      <g clipPath={`url(#${id}c)`}>
        {STREAKS.map((s) => (
          <line
            key={s.y}
            x1="3"
            x2="15"
            y1={s.y}
            y2={s.y}
            stroke={s.color}
            strokeWidth="1.6"
            strokeLinecap="round"
            className={cn('animate-loader-streak opacity-0', still)}
            style={{ animationDelay: s.delay }}
          />
        ))}
      </g>
      <polyline
        points={DOTS.map((d) => `${d.cx},${d.cy}`).join(' ')}
        stroke="var(--color-accent-soft)"
        strokeWidth="0.8"
        strokeLinecap="round"
        className={cn('animate-loader-link opacity-70', still)}
      />
      {DOTS.map((d) => (
        <circle
          key={d.cy}
          cx={d.cx}
          cy={d.cy}
          r="1.7"
          fill="var(--color-accent)"
          className={cn('origin-self animate-loader-dot', still)}
          style={{ animationDelay: d.delay }}
        />
      ))}
      <path d={B_PATH} fill={`url(#${id}g)`} className={cn('animate-loader-fill', still)} />
      <path
        d={B_PATH}
        pathLength="1"
        stroke={`url(#${id}g)`}
        strokeWidth="1.2"
        strokeLinejoin="round"
        strokeDasharray="1"
        strokeDashoffset="0"
        className={cn('animate-loader-trace', still)}
      />
    </svg>
  );
}

// Variante por categoría: balón que rebota, nota que vibra, árbol que se mece, chispa que late (colores de EventCover)
const CATEGORY_LOADERS = {
  sport: { Icon: BallIcon, motion: 'animate-ball-bounce', tone: 'text-accent-soft' },
  culture: { Icon: MusicIcon, motion: 'animate-note-shake', tone: 'text-culture' },
  recreation: { Icon: TreeIcon, motion: 'animate-tree-sway origin-bottom', tone: 'text-success' },
  other: { Icon: SparklesIcon, motion: 'animate-sparkle', tone: 'text-ink-muted' },
};

export function CategoryGlyph({ category, px = 52, className }) {
  const key = category in CATEGORY_LOADERS ? category : 'other';
  const { Icon, motion, tone } = CATEGORY_LOADERS[key];
  return (
    <span className={cn('inline-flex', tone, className)} data-loader={key}>
      <Icon size={px} strokeWidth={1.6} className={cn(motion, still)} />
    </span>
  );
}

export const BrandLoader = forwardRef(function BrandLoader(
  { size = 'md', category, phrases = size !== 'sm', label = 'Cargando', message, className, ...props },
  ref,
) {
  const px = SIZES[size] ?? SIZES.md;
  const index = usePhraseIndex(LOADING_PHRASES.length, phrases && !message);
  const text = message ?? (phrases ? LOADING_PHRASES[index] : null);
  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      className={cn('flex flex-col items-center gap-3 text-center', className)}
      {...props}
    >
      {category ? <CategoryGlyph category={category} px={px} /> : <BrandGlyph px={px} />}
      {/* Lo único que se anuncia: "Cargando" una vez (o el aviso de que tarda) */}
      <span className="sr-only">{message ?? label}</span>
      {text && (
        <p key={text} aria-hidden="true" className={cn('min-h-5 animate-phrase text-sm text-ink-muted', still)}>
          {text}
        </p>
      )}
    </div>
  );
});
