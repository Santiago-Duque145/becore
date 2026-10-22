import { useState } from 'react';
import { BrandLoader, Button, FullScreenLoader, LoadingDots, Skeleton } from '../../components/ui/index.js';
import { Section } from './dev-sections.jsx';

const CATEGORIES = [
  { id: 'sport', label: 'Deporte' },
  { id: 'culture', label: 'Cultura' },
  { id: 'recreation', label: 'Recreación' },
  { id: 'other', label: 'Otros' },
];

// P7 · Cargadores de la marca en /dev/ui: tamaños, variantes por categoría, puntos de botón, skeleton con barrido
// y el loader de pantalla completa (normal y "tardando más de lo normal", en un recuadro).
export function LoadersDemo() {
  const [run, setRun] = useState(0); // remonta los loaders de pantalla completa para volver a ver los 300 ms
  return (
    <Section title="Cargadores de marca (P7)">
      <div className="flex flex-wrap items-end gap-10">
        <BrandLoader size="sm" />
        <BrandLoader size="md" />
        <BrandLoader size="lg" />
      </div>

      <div className="mt-8 flex flex-wrap items-end gap-10">
        {CATEGORIES.map((category) => (
          <div key={category.id} className="flex flex-col items-center gap-2">
            <BrandLoader size="md" category={category.id} phrases={false} />
            <span className="text-xs text-ink-muted">{category.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button loading>Guardando</Button>
        <Button variant="secondary" loading>
          Enviando
        </Button>
        <span className="text-accent">
          <LoadingDots />
        </span>
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-3">
        <Skeleton className="h-28" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-28 w-28 rounded-full" />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2" key={run}>
        <FullScreenLoader variant="inline" />
        <FullScreenLoader variant="inline" immediate slowAfter={0} onRetry={() => setRun((n) => n + 1)} />
      </div>
      <Button variant="secondary" size="sm" className="mt-3" onClick={() => setRun((n) => n + 1)}>
        Repetir la espera
      </Button>
    </Section>
  );
}
