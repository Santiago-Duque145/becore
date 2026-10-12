import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Toast } from './Toast.jsx';
import { ToastContext } from './toast-context.js';

const DURATION_MS = 4000;
const ACTION_DURATION_MS = 8000; // con botón ("Reintentar") se da más tiempo para tocarlo
const MAX_VISIBLE = 3;

// Pila de avisos en la parte inferior: sobre la barra de pestañas en móvil, en la esquina en escritorio.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (type, message, { action } = {}) => {
      const id = ++nextId.current;
      // La acción cierra el aviso antes de ejecutarse
      const toastAction = action && { label: action.label, onClick: () => (dismiss(id), action.onClick()) };
      setToasts((current) => [...current, { id, type, message, action: toastAction }].slice(-MAX_VISIBLE));
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), action ? ACTION_DURATION_MS : DURATION_MS),
      );
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => clearTimeout(timer));
  }, []);

  const api = useMemo(
    () => ({
      success: (message, options) => show('success', message, options),
      error: (message, options) => show('error', message, options),
      info: (message, options) => show('info', message, options),
      dismiss,
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-[70] flex flex-col items-center gap-2 px-4 md:right-6 md:bottom-6 md:left-auto md:w-96 md:items-end md:px-0"
      >
        {toasts.map((t) => (
          <Toast key={t.id} type={t.type} message={t.message} action={t.action} onClose={() => dismiss(t.id)} className="max-w-md" />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
