import { cn } from '../../lib/cn.js';

// P7 · Botones en loading: tres puntos que rebotan (solo transform y opacity). Heredan el color del texto.
const DELAYS = ['0s', '0.15s', '0.3s'];

export function LoadingDots({ className }) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)} aria-hidden="true" data-loading-dots="">
      {DELAYS.map((delay) => (
        <span
          key={delay}
          className="size-1.5 animate-dot-bounce rounded-full bg-current motion-reduce:animate-none"
          style={{ animationDelay: delay }}
        />
      ))}
    </span>
  );
}
