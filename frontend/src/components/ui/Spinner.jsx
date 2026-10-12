import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';
import { LoaderIcon } from '../icons/index.js';

// Solo para esperas de pantalla completa (p. ej. validar la sesión). Las acciones usan Button loading.
export const Spinner = forwardRef(function Spinner({ label = 'Cargando', className, ...props }, ref) {
  return (
    <div
      ref={ref}
      role="status"
      className={cn('flex items-center justify-center gap-2 py-10 text-sm text-ink-muted', className)}
      {...props}
    >
      <LoaderIcon size={20} className="animate-spin text-accent motion-reduce:animate-none" />
      <span>{label}…</span>
    </div>
  );
});
