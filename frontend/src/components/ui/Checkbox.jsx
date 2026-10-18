import { forwardRef, useId } from 'react';
import { cn } from '../../lib/cn.js';

// Casilla con su texto (skill §3). Toda la fila es clicable; el error se anuncia con role="alert".
// `label` puede llevar un enlace; abrirlo no marca ni desmarca la casilla.
export const Checkbox = forwardRef(function Checkbox({ label, error, id, className, ...props }, ref) {
  const autoId = useId();
  const controlId = id ?? autoId;
  const errorId = `${controlId}-error`;
  return (
    <div className={cn('mb-4', className)}>
      <label
        htmlFor={controlId}
        className="flex min-h-11 cursor-pointer items-start gap-3 py-1.5 text-[13px] leading-5 text-ink-muted"
      >
        <input
          ref={ref}
          id={controlId}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="focus-ring mt-px h-5 w-5 shrink-0 cursor-pointer rounded-md accent-accent"
          {...props}
        />
        <span>{label}</span>
      </label>
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
});
