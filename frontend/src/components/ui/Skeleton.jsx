import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';

// Bloque de carga con la forma del contenido real (skill §3)
export const Skeleton = forwardRef(function Skeleton({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn('animate-pulse rounded-card bg-field motion-reduce:animate-none', className)}
      {...props}
    />
  );
});
