import { useId } from 'react';
import { useRecommendedEvents } from '../../hooks/useRecommendedEvents.js';
import { EventCard } from '../../components/events/EventCard.jsx';

// "Para ti" (auth-onboarding §8): carrusel horizontal con la razón de cada recomendación.
// Mientras carga, si falla o si no hay resultados, la sección no se muestra (no es un vacío).
export function ParaTiCarousel() {
  const titleId = useId();
  const { data } = useRecommendedEvents();
  if (!data?.length) return null;

  return (
    <section aria-labelledby={titleId} className="mb-6 animate-enter motion-reduce:animate-none">
      <h2 id={titleId} className="mb-3 font-display text-base font-semibold text-ink">
        Para ti
      </h2>
      <ul className="-mx-[22px] flex snap-x snap-mandatory gap-3.5 overflow-x-auto scroll-px-[22px] px-[22px] pb-1 md:mx-0 md:scroll-px-0 md:px-0">
        {data.map((event) => (
          <li key={event.id} className="w-[270px] shrink-0 snap-start md:w-[300px]">
            <EventCard event={event} reason={event.reason} className="h-full" />
          </li>
        ))}
      </ul>
    </section>
  );
}
