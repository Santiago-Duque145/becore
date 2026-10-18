import { LinkButton } from '../ui/index.js';
import { StarIcon } from '../icons/index.js';
import { useMyRating } from '../../hooks/useRatings.js';
import { canRateEvent } from '../../lib/ratings.js';
import { cn } from '../../lib/cn.js';

// "¿Cómo estuvo? Califica" para quien hizo check-in en un evento finalizado (dentro de 7 días).
// Si ya calificó, ofrece editar.
export function RateBanner({ event, className }) {
  const eligible = canRateEvent(event);
  const { data: mine, isPending } = useMyRating(event.id, { enabled: eligible });
  if (!eligible || isPending) return null;
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-[14px] border border-culture/25 bg-culture/10 px-3.5 py-3',
        className,
      )}
    >
      <p className="flex items-center gap-2 text-[12.5px] font-semibold text-culture">
        <StarIcon size={16} className="shrink-0" fill="currentColor" />
        {mine ? `Tu calificación: ${mine.stars} de 5` : '¿Cómo estuvo? Califica'}
      </p>
      <LinkButton to={`/eventos/${event.id}/calificar`} variant="secondary" size="sm" className="shrink-0">
        {mine ? 'Editar' : 'Calificar'}
      </LinkButton>
    </div>
  );
}
