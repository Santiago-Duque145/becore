import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';
import { AlertCircleIcon, CalendarIcon } from '../icons/index.js';

// Ícono + título + una frase + una acción. Nunca una pantalla en blanco (skill §3).
// variant="error" para fallos de carga (role="alert").
export const EmptyState = forwardRef(function EmptyState(
  { icon, title, description, action, variant = 'empty', className, ...props },
  ref,
) {
  const isError = variant === 'error';
  const Icon = icon ?? (isError ? AlertCircleIcon : CalendarIcon);
  return (
    <div
      ref={ref}
      role={isError ? 'alert' : undefined}
      className={cn(
        'flex flex-col items-center gap-3 rounded-card border border-dashed px-6 py-12 text-center',
        isError ? 'border-danger/40 bg-danger/5' : 'border-line bg-panel/60',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full',
          isError ? 'bg-danger/15 text-danger' : 'bg-field text-accent-soft',
        )}
      >
        <Icon size={22} />
      </span>
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
});
