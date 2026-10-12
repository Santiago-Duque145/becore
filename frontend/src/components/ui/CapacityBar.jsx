import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';

const ALMOST_FULL = 0.8;

// Umbrales de ui.md §4 con tokens de la skill (auditoría d-9):
// accent < 80 %, action ≥ 80 % ("Casi lleno"), ink-faint lleno ("Lleno"). Texto visible "24 / 40".
export function capacityState(confirmedCount, capacity) {
  if (capacity > 0 && confirmedCount >= capacity) return 'full';
  if (capacity > 0 && confirmedCount / capacity >= ALMOST_FULL) return 'almost_full';
  return 'open';
}

const STATES = {
  open: { bar: 'bg-accent', text: null },
  almost_full: { bar: 'bg-action', text: 'Casi lleno', textClass: 'text-action' },
  full: { bar: 'bg-ink-faint', text: 'Lleno', textClass: 'text-ink-muted' },
};

export const CapacityBar = forwardRef(function CapacityBar(
  { confirmedCount, capacity, label = 'Cupos', live = false, className, ...props },
  ref,
) {
  const percent = capacity > 0 ? Math.min((confirmedCount / capacity) * 100, 100) : 0;
  const state = STATES[capacityState(confirmedCount, capacity)];
  return (
    <div ref={ref} className={cn('w-full', className)} {...props}>
      <div className="mb-2 flex items-center justify-between gap-2 text-[12.5px]">
        <span className="flex items-center gap-1.5 text-ink-muted">
          {live && (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent motion-reduce:animate-none" aria-hidden="true" />
          )}
          {label}
          {state.text && <span className={cn('font-semibold', state.textClass)}>· {state.text}</span>}
        </span>
        <span className="font-bold text-ink tabular-nums">
          {confirmedCount} / {capacity}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={Math.min(confirmedCount, capacity)}
        aria-valuetext={`${confirmedCount} de ${capacity} cupos ocupados${state.text ? `, ${state.text.toLowerCase()}` : ''}`}
        aria-label={label}
        className="h-[7px] w-full overflow-hidden rounded-full bg-line"
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-200 ease-out-soft motion-reduce:transition-none',
            state.bar,
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
});
