import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';
import { AlertCircleIcon, CheckIcon, InfoIcon, XIcon } from '../icons/index.js';

const TYPES = {
  success: { Icon: CheckIcon, className: 'bg-success/15 text-success' },
  error: { Icon: AlertCircleIcon, className: 'bg-danger/15 text-danger' },
  info: { Icon: InfoIcon, className: 'bg-accent/15 text-accent-soft' },
};

// Aviso breve (skill §3). Lo muestra ToastProvider; aquí solo está su apariencia.
// action opcional: { label, onClick }, p. ej. "Reintentar" en un error de red.
export const Toast = forwardRef(function Toast({ type = 'info', message, action, onClose, className, ...props }, ref) {
  const { Icon, className: iconClass } = TYPES[type];
  return (
    <div
      ref={ref}
      className={cn(
        'pointer-events-auto flex w-full items-start gap-3 rounded-card border border-line bg-panel py-3 pr-2 pl-3 text-sm text-ink shadow-lg shadow-black/30',
        'animate-enter motion-reduce:animate-none',
        className,
      )}
      {...props}
    >
      <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', iconClass)}>
        <Icon size={16} />
      </span>
      <p className="min-w-0 flex-1 self-center">{message}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="focus-ring -my-1 min-h-9 shrink-0 self-center rounded-field px-3 text-xs font-semibold text-accent hover:bg-accent/10 hover:text-accent-soft"
        >
          {action.label}
        </button>
      )}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar aviso"
          className="focus-ring -my-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-field text-ink-muted hover:text-ink"
        >
          <XIcon size={16} />
        </button>
      )}
    </div>
  );
});
