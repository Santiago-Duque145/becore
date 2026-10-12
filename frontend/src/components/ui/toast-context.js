import { createContext, useContext } from 'react';

export const ToastContext = createContext(null);

// const toast = useToast(); toast.success('¡Listo!'); toast.error(error.message); toast.info('…')
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return context;
}
