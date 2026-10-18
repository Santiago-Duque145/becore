import { useQueries } from '@tanstack/react-query';
import { StarIcon } from '../icons/index.js';
import { EmptyState, Skeleton } from '../ui/index.js';
import { RATING_TAG_LABELS } from '../../constants/ratings.js';
import { formatAverage, overallAverage } from '../../lib/ratings.js';
import { queryKeys } from '../../lib/query-keys.js';
import * as ratingsApi from '../../services/ratings.api.js';
import { formatDate } from '../../lib/format.js';

function Stars({ value }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-culture" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} size={12} fill={n <= Math.round(value) ? 'currentColor' : 'none'} />
      ))}
    </span>
  );
}

// Distribución de estrellas: una barra por cada valor, de 5 a 1
function Distribution({ byStars, total }) {
  return (
    <ul className="flex flex-col gap-1" aria-label="Distribución de estrellas">
      {[5, 4, 3, 2, 1].map((n) => (
        <li key={n} className="flex items-center gap-2 text-[11px] text-ink-muted">
          <span className="w-7 tabular-nums">{n} ★</span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-field">
            <span className="block h-full rounded-full bg-culture" style={{ width: `${total ? (byStars[n] / total) * 100 : 0}%` }} />
          </span>
          <span className="w-5 text-right tabular-nums">{byStars[n]}</span>
        </li>
      ))}
    </ul>
  );
}

// Calificaciones de mis eventos finalizados: promedio general y por evento, distribución y últimos comentarios
export function RatingsPanel({ events }) {
  const finished = events.filter((e) => e.status === 'finished');
  const results = useQueries({
    queries: finished.map((event) => ({
      queryKey: queryKeys.ratingSummary(event.id),
      staleTime: 60_000,
      queryFn: async () => (await ratingsApi.getRatingSummary(event.id)).data,
    })),
  });

  const loading = results.some((r) => r.isPending);
  const rows = finished.map((event, i) => ({ event, summary: results[i].data })).filter((r) => r.summary?.total > 0);
  const overall = overallAverage(rows.map((r) => r.summary));
  const comments = rows
    .flatMap(({ event, summary }) => (summary.comments ?? []).map((c) => ({ ...c, title: event.title })))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
  const allStars = rows.reduce(
    (acc, { summary }) => {
      for (const n of [1, 2, 3, 4, 5]) acc[n] += summary.byStars[n];
      return acc;
    },
    { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  );

  return (
    <section aria-labelledby="calificaciones-panel" className="mt-5 rounded-card border border-white/[0.06] bg-panel">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4 md:px-[22px] md:py-[18px]">
        <h2 id="calificaciones-panel" className="font-display text-[15px] font-semibold text-ink">
          Calificaciones
        </h2>
        {overall.average !== null && (
          <span className="flex items-center gap-1 text-xs font-semibold text-culture">
            <StarIcon size={14} fill="currentColor" /> {formatAverage(overall.average)} ({overall.total})
          </span>
        )}
      </div>

      {loading && <Skeleton className="m-4 h-24" />}
      {!loading && rows.length === 0 && (
        <EmptyState
          className="m-4"
          title="Aún no tienes calificaciones."
          description="Aparecerán cuando tus participantes califiquen eventos finalizados."
        />
      )}
      {!loading && rows.length > 0 && (
        <div className="flex flex-col gap-5 p-4 md:p-[22px]">
          <Distribution byStars={allStars} total={overall.total} />

          <ul className="flex flex-col gap-2.5">
            {rows.map(({ event, summary }) => {
              const topTag = Object.entries(summary.byTag).sort((a, b) => b[1] - a[1])[0];
              return (
                <li key={event.id} className="flex items-center justify-between gap-3 text-[12.5px]">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink">{event.title}</span>
                    {topTag?.[1] > 0 && <span className="text-[11px] text-ink-muted">Lo más votado: {RATING_TAG_LABELS[topTag[0]]}</span>}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 text-culture">
                    <Stars value={summary.average} />
                    <span className="font-semibold tabular-nums">
                      {formatAverage(summary.average)} ({summary.total})
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>

          {comments.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold text-ink-muted">Últimos comentarios</h3>
              <ul className="flex flex-col gap-2">
                {comments.map((c, i) => (
                  <li key={i} className="rounded-field bg-field px-3 py-2.5 text-[12.5px] text-ink/90">
                    “{c.comment}”
                    <span className="mt-1 block text-[11px] text-ink-muted">
                      {c.stars} ★ · {c.title} · {formatDate(c.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
