import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';
import { BrandLoader } from './BrandLoader.jsx';

// Espera corta dentro de una pantalla con un texto fijo ("Verificando tu código…"). Desde P7 es el BrandLoader
// pequeño; las esperas de pantalla completa usan FullScreenLoader y las acciones, Button loading.
export const Spinner = forwardRef(function Spinner({ label = 'Cargando', className, ...props }, ref) {
  return <BrandLoader ref={ref} size="sm" label={label} message={`${label}…`} className={cn('py-10', className)} {...props} />;
});
