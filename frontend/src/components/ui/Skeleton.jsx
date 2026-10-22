import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';

// Bloque de carga con la forma del contenido real (skill §3). Brillo de marca (P7): barrido turquesa suave
// (utilidad skeleton-sweep de index.css) en lugar del pulso gris; quieto con prefers-reduced-motion.
export const Skeleton = forwardRef(function Skeleton({ className, ...props }, ref) {
  return <div ref={ref} aria-hidden="true" className={cn('skeleton-sweep rounded-card bg-field', className)} {...props} />;
});
