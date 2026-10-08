import { useEffect, useRef } from 'react';

export function Modal({ open, title, children, onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-navy-900/70 p-4 md:items-center">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl focus:outline-none"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <h2 className="mb-2 font-display text-lg font-semibold text-navy-900">{title}</h2>
        {children}
      </div>
    </div>
  );
}
