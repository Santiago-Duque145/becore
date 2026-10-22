import { cn } from '../../lib/cn.js';
import { confettiPieces } from '../../lib/confetti.js';

const PIECES = confettiPieces();

// Confeti en CSS del final del onboarding (P1): sale del centro del check, 1.5 s, decorativo.
// Con prefers-reduced-motion no se pinta (motion-reduce:hidden).
export function Confetti() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2 motion-reduce:hidden">
      {PIECES.map((p) => (
        <span
          key={p.id}
          className={cn(
            'absolute -top-1 -left-1 animate-confetti',
            p.round ? 'h-2 w-2 rounded-full' : 'h-2.5 w-1.5 rounded-[2px]',
            p.color,
          )}
          style={{ '--cx': `${p.x}px`, '--cy': `${p.y}px`, '--cr': `${p.rotate}deg`, animationDelay: `${p.delayMs}ms` }}
        />
      ))}
    </span>
  );
}
