import { useEffect, useState } from 'react';
import { LOADER_DELAY_MS, LOADER_SLOW_MS, SLOW_MESSAGE } from '../../constants/loading.js';
import { useElapsed } from '../../hooks/useLoaderTiming.js';
import { cn } from '../../lib/cn.js';
import { BrandLoader } from './BrandLoader.jsx';
import { Button } from './Button.jsx';

const VARIANTS = {
  screen: 'min-h-dvh', // la pantalla entera (arranque, /auth/callback, rutas diferidas)
  overlay: 'fixed inset-0 z-50', // encima de un formulario que se está guardando (onboarding)
  inline: 'min-h-72 rounded-card border border-line', // solo para /dev/ui
};

// P7 · Espera de pantalla completa con el BrandLoader.
// - Aparece a los 300 ms (antes, solo el fondo: sin parpadeo). `immediate` cuando quien lo usa ya esperó esos 300 ms
//   con useLoaderVisibility, que además lo mantiene mínimo 500 ms.
// - A los 8 s cambia a "Esto está tardando más de lo normal…" con Reintentar (por defecto recarga la página).
//   slowAfter={null} lo desactiva (pantallas que ya tienen su propio límite, como /auth/callback).
export function FullScreenLoader({
  immediate = false,
  category,
  onRetry,
  variant = 'screen',
  slowAfter = LOADER_SLOW_MS,
  className,
}) {
  const [shown, setShown] = useState(immediate);
  const slow = useElapsed(slowAfter);

  useEffect(() => {
    if (shown) return undefined;
    const timer = setTimeout(() => setShown(true), LOADER_DELAY_MS);
    return () => clearTimeout(timer);
  }, [shown]);

  return (
    <div className={cn('flex items-center justify-center bg-bg px-6', VARIANTS[variant], className)} aria-busy="true">
      {shown && (
        <div className="flex animate-enter flex-col items-center gap-5 motion-reduce:animate-none">
          <BrandLoader size="lg" category={category} message={slow ? SLOW_MESSAGE : undefined} />
          {slow && (
            <Button variant="secondary" onClick={onRetry ?? (() => window.location.reload())}>
              Reintentar
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
