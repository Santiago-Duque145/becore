import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';

// Barra segmentada de n pasos (skill §3). `current` empieza en 1.
// P1: cada segmento se llena de izquierda a derecha (scale-x) al avanzar y se vacía al volver; quieto con motion-reduce.
export const ProgressSteps = forwardRef(function ProgressSteps({ total, current, className, ...props }, ref) {
  return (
    <div ref={ref} className={cn('w-full', className)} {...props}>
      <div className="flex gap-1.5" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className="relative h-1 flex-1 overflow-hidden rounded-full bg-line">
            <span
              className={cn(
                'absolute inset-0 origin-left rounded-full transition duration-300 ease-out-soft motion-reduce:transition-none',
                i < current - 1 ? 'bg-accent' : 'bg-accent/60',
                i < current ? 'scale-x-100' : 'scale-x-0',
              )}
            />
          </span>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        Paso {current} de {total}
      </p>
    </div>
  );
});
