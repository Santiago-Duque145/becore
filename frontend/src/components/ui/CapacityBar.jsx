import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';
import { capacityText } from '../../lib/capacity.js';

const ALMOST_FULL = 0.8;

// Umbrales de ui.md §4 con tokens de la skill (auditoría d-9): accent < 80 %, action ≥ 80 %, ink-faint lleno.
// Texto visible: "Confirmados 24 de 40" arriba y "16 cupos disponibles" / "Cupo lleno" debajo (lib/capacity.js).
export function capacityState(confirmedCount, capacity) {
  if (capacity > 0 && confirmedCount >= capacity) return 'full';
  if (capacity > 0 && confirmedCount / capacity >= ALMOST_FULL) return 'almost_full';
  return 'open';
}

const BAR = { open: 'bg-accent', almost_full: 'bg-action', full: 'bg-ink-faint' };
const AVAILABLE_TEXT = { open: 'text-ink-muted', almost_full: 'font-semibold text-action', full: 'font-semibold text-ink-muted' };

export const CapacityBar = forwardRef(function CapacityBar(
  { confirmedCount, capacity, label = 'Cupo', live = false, className, ...props },
  ref,
) {
  const percent = capacity > 0 ? Math.min((confirmedCount / capacity) * 100, 100) : 0;
  const state = capacityState(confirmedCount, capacity);
  const text = capacityText(confirmedCount, capacity);
  return (
    <div ref={ref} className={cn('w-full', className)} {...props}>
      <div className="mb-2 flex items-center gap-1.5 text-[12.5px] font-bold text-ink tabular-nums">
        {live && (
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent motion-reduce:animate-none" aria-hidden="true" />
        )}
        {text.confirmed}
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={Math.min(confirmedCount, capacity)}
        aria-valuetext={`${text.confirmed}. ${text.available}`}
        aria-label={label}
        className="h-[7px] w-full overflow-hidden rounded-full bg-line"
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-200 ease-out-soft motion-reduce:transition-none',
            BAR[state],
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className={cn('mt-1.5 text-xs', AVAILABLE_TEXT[state])}>{text.available}</p>
    </div>
  );
});
