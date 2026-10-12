import { Suspense } from 'react';
import { Skeleton } from '../ui/index.js';

// Mientras se descarga el código de una página (carga diferida por ruta, R9).
// 'content': dentro del AppShell (bloques con la forma de una página). 'screen': pantalla completa (auth).
function PageFallback({ variant }) {
  if (variant === 'screen') {
    return <div className="min-h-dvh bg-bg" aria-busy="true" aria-label="Cargando" />;
  }
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Cargando">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-11 w-full" />
      <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>
    </div>
  );
}

// page(Componente) → <Suspense> con su skeleton. Se usa en router.jsx.
export function page(Component, variant = 'content') {
  return (
    <Suspense fallback={<PageFallback variant={variant} />}>
      <Component />
    </Suspense>
  );
}
