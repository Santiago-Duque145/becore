import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';

// Barra segmentada de n pasos (skill §3). `current` empieza en 1.
export const ProgressSteps = forwardRef(function ProgressSteps({ total, current, className, ...props }, ref) {
  return (
    <div ref={ref} className={cn('w-full', className)} {...props}>
      <div className="flex gap-1.5" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-200 motion-reduce:transition-none',
              i < current - 1 ? 'bg-accent' : i === current - 1 ? 'bg-accent/60' : 'bg-line',
            )}
          />
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        Paso {current} de {total}
      </p>
    </div>
  );
});
