import { useEffect, useId, useRef } from 'react';
import { cn } from '../../lib/cn.js';
import { FOCUSABLE, nextTabIndex } from '../../lib/focus-trap.js';

const NOOP = () => {}; // estable: un onClose nuevo en cada render volvería a enfocar el panel

// Diálogo modal: hoja inferior en móvil, centrado en escritorio. role="dialog" + aria-modal, foco atrapado
// (Tab da la vuelta dentro del panel) y scrim detrás. Escape y clic afuera cierran y el foco vuelve al
// disparador, salvo con dismissible={false}: entonces el usuario solo sale con los botones del propio diálogo.
export function Modal({ open, title, children, onClose = NOOP, dismissible = true, className }) {
  const panelRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    const onKey = (e) => {
      if (e.key === 'Escape' && dismissible) onClose();
      if (e.key !== 'Tab') return;
      const items = [...(panelRef.current?.querySelectorAll(FOCUSABLE) ?? [])];
      const target = nextTabIndex(items.length, items.indexOf(document.activeElement), e.shiftKey);
      e.preventDefault();
      (target === -1 ? panelRef.current : items[target])?.focus();
    };
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      previousFocus?.focus?.();
    };
  }, [open, onClose, dismissible]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-bg/80 backdrop-blur-sm md:items-center md:p-4"
      onClick={(e) => dismissible && e.target === e.currentTarget && onClose()}
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
