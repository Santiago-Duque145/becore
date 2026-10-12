import { useEffect, useId, useRef } from 'react';
import { cn } from '../../lib/cn.js';

// Diálogo modal: hoja inferior en móvil, centrado en escritorio. Escape cierra y el foco vuelve al disparador.
export function Modal({ open, title, children, onClose, className }) {
  const panelRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      previousFocus?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-bg/80 backdrop-blur-sm md:items-center md:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'pb-safe w-full max-w-md animate-enter rounded-t-sheet border border-line bg-sheet outline-none motion-reduce:animate-none md:rounded-card',
          className,
        )}
      >
        <div className="p-6">
          <h2 id={titleId} className="mb-2 font-display text-lg font-semibold text-ink">
            {title}
          </h2>
          {children}
        </div>
      </div>
    </div>
  );
}
