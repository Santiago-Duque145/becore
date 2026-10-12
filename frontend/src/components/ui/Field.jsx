import { forwardRef, useId } from 'react';
import { cn } from '../../lib/cn.js';
import { FieldContext } from './field-context.js';

// Envuelve label + control + ayuda/error (skill §3). El control hijo toma id y aria-* del contexto.
export const Field = forwardRef(function Field({ label, hint, error, id, className, children }, ref) {
  const autoId = useId();
  const controlId = id ?? autoId;
  const context = {
    id: controlId,
    errorId: `${controlId}-error`,
    hintId: `${controlId}-hint`,
    invalid: Boolean(error),
    hint: Boolean(hint && !error),
  };

  return (
    <FieldContext.Provider value={context}>
      <div ref={ref} className={cn('mb-4', className)}>
        <label htmlFor={controlId} className="mb-[7px] block text-xs font-semibold text-ink-muted">
          {label}
        </label>
        {children}
        {hint && !error && (
          <p id={context.hintId} className="mt-1.5 text-xs text-ink-muted">
            {hint}
          </p>
        )}
        {error && (
          <p id={context.errorId} role="alert" className="mt-1.5 text-xs font-medium text-danger">
            {error}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
});

