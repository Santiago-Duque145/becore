import { createContext, useContext } from 'react';

export const ToastContext = createContext(null);

// const toast = useToast(); toast.success('¡Listo!'); toast.error(error.message); toast.info('…')
// Con acción: toast.error(msg, { action: { label: 'Reintentar', onClick: retry } })
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return context;
}
