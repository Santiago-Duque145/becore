import { useId } from 'react';
import { EventCard, EventCardSkeleton } from '../../components/events/EventCard.jsx';
import { Skeleton } from '../../components/ui/index.js';

// "Para ti" (auth-onboarding §8): carrusel horizontal con la razón de cada recomendación.
// Si falla o no hay resultados, la sección no se muestra (no es un vacío). Los datos los pide DescubrePage, que no pinta
// la lista hasta saber si hay "Para ti": así el carrusel nunca aparece encima de una lista ya pintada (CLS).
const ROW = '-mx-[22px] flex gap-3.5 px-[22px] pb-1 md:mx-0 md:px-0';
const ITEM = 'w-[270px] shrink-0 md:w-[300px]';

export function ParaTiCarousel({ events, priorityFirst = false }) {
  const titleId = useId();
  if (!events?.length) return null;

  return (
    <section aria-labelledby={titleId} className="mb-6 animate-enter motion-reduce:animate-none">
      <h2 id={titleId} className="mb-3 font-display text-base leading-6 font-semibold text-ink">
        Para ti
      </h2>
      <ul className={`${ROW} snap-x snap-mandatory overflow-x-auto scroll-px-[22px] md:scroll-px-0`}>
        {events.map((event, index) => (
          <li key={event.id} className={`${ITEM} snap-start`}>
            <EventCard event={event} reason={event.reason} priority={priorityFirst && index === 0} className="h-full" />
          </li>
        ))}
      </ul>
    </section>
  );
}

// Mismo alto que la sección real: título (24 px + 12 de margen) y una fila de tarjetas con el ancho del carrusel
export function ParaTiSkeleton() {
  return (
    <div className="mb-6" aria-hidden="true">
      <Skeleton className="mb-3 h-6 w-20 rounded-field" />
      <div className={`${ROW} overflow-hidden`}>
        {[0, 1, 2].map((i) => (
          <EventCardSkeleton key={i} className={ITEM} withReason />
        ))}
      </div>
    </div>
  );
}
