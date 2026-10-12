import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Toast } from './Toast.jsx';
import { ToastContext } from './toast-context.js';

const DURATION_MS = 4000;
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
    (type, message) => {
      const id = ++nextId.current;
      setToasts((current) => [...current, { id, type, message }].slice(-MAX_VISIBLE));
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), DURATION_MS),
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
      success: (message) => show('success', message),
      error: (message) => show('error', message),
      info: (message) => show('info', message),
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
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[70] flex flex-col items-center gap-2 px-4 md:right-6 md:bottom-6 md:left-auto md:w-96 md:items-end md:px-0"
      >
        {toasts.map((t) => (
          <Toast key={t.id} type={t.type} message={t.message} onClose={() => dismiss(t.id)} className="max-w-md" />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
