import { useId } from 'react';
import { EventCard, EventCardSkeleton } from '../../components/events/EventCard.jsx';
import { CheckIcon, SparklesIcon } from '../../components/icons/index.js';
import { EmptyState, LinkButton, Skeleton } from '../../components/ui/index.js';
import { sendRecommendationClick } from '../../services/recommendations.api.js';

// "Para ti" (auth-onboarding §8): carrusel horizontal con la razón de cada recomendación.
// Los datos los pide DescubrePage, que no pinta la lista hasta saber si hay "Para ti": así el carrusel nunca aparece
// encima de una lista ya pintada (CLS). Si viene vacío, según el motivo que da la API:
// - all_confirmed / no_matches → estado vacío amable con una acción (la sección no desaparece);
// - no_preferences / no_events / error → no se muestra (no hay nada útil que decir aquí; la lista de abajo lo cubre).
const ROW = '-mx-[22px] flex gap-3.5 px-[22px] pb-1 md:mx-0 md:px-0';

// IA4: abrir una tarjeta de "Para ti" cuenta como clic en la prueba A/B. Sin esperar ni avisar si falla: no es del usuario.
const countClick = (eventId) => () => {
  sendRecommendationClick(eventId).catch(() => {});
};
const ITEM = 'w-[270px] shrink-0 md:w-[300px]';

export const PARA_TI_EMPTY = {
  all_confirmed: {
    icon: CheckIcon,
    title: 'Ya estás en todo lo que encaja contigo.',
    description: 'Explora más abajo: puede que encuentres un plan nuevo.',
    action: { to: '/mis-eventos', label: 'Ver mis eventos' },
  },
  no_matches: {
    icon: SparklesIcon,
    title: 'Aún no hay eventos que encajen con tus gustos.',
    description: 'Mira los próximos eventos más abajo o ajusta tus gustos.',
    action: { to: '/perfil', label: 'Ajustar mis gustos' },
  },
};

function Title({ id }) {
  return (
    <h2 id={id} className="mb-3 font-display text-base leading-6 font-semibold text-ink">
      Para ti
    </h2>
  );
}

export function ParaTiCarousel({ events, emptyReason = null, priorityFirst = false }) {
  const titleId = useId();
  const empty = PARA_TI_EMPTY[emptyReason];

  if (!events?.length) {
    if (!empty) return null;
    return (
      <section aria-labelledby={titleId} className="mb-6 animate-enter motion-reduce:animate-none">
        <Title id={titleId} />
        <EmptyState
          size="sm"
          icon={empty.icon}
          title={empty.title}
          description={empty.description}
          action={
            <LinkButton to={empty.action.to} variant="secondary" size="sm">
              {empty.action.label}
            </LinkButton>
          }
        />
      </section>
    );
  }

  return (
    <section aria-labelledby={titleId} className="mb-6 animate-enter motion-reduce:animate-none">
      <Title id={titleId} />
      <ul className={`${ROW} snap-x snap-mandatory overflow-x-auto scroll-px-[22px] md:scroll-px-0`}>
        {events.map((event, index) => (
          <li key={event.id} className={`${ITEM} snap-start`}>
            <EventCard
              event={event}
              reason={event.reason}
              reasonKind={event.reasonKind}
              priority={priorityFirst && index === 0}
              onOpen={countClick(event.id)}
              className="h-full"
            />
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
