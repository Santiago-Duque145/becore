import { StarIcon } from '../icons/index.js';
import { useRatingSummary } from '../../hooks/useRatings.js';
import { formatAverage } from '../../lib/ratings.js';
import { cn } from '../../lib/cn.js';

// "★ 4,6 (12)" en eventos finalizados. Sin calificaciones todavía no muestra nada.
export function RatingBadge({ event, className }) {
  const enabled = event.status === 'finished';
  const { data } = useRatingSummary(event.id, { enabled });
  if (!enabled || !data?.total) return null;
  return (
    <span
      className={cn('inline-flex items-center gap-1 text-xs font-semibold text-culture', className)}
      aria-label={`Calificación ${formatAverage(data.average)} de 5, ${data.total} ${data.total === 1 ? 'voto' : 'votos'}`}
    >
      <StarIcon size={13} fill="currentColor" />
      <span aria-hidden="true">
        {formatAverage(data.average)} ({data.total})
      </span>
    </span>
  );
}
