import { SparklesIcon } from '../icons/index.js';
import { EmptyState, ErrorState, Skeleton } from '../ui/index.js';
import { useAiMetrics } from '../../hooks/useAiMetrics.js';
import { comparisonRows, hasData, isSmallSample, sourceLine } from '../../lib/ai-metrics.js';

// IA4 · "Recomendaciones IA vs reglas": la prueba A/B de "Para ti" (docs/specs/ai.md §10), sin eventos de demostración.
// Mostrados = pares distintos (persona, evento); abiertos y confirmados cuentan si vinieron de "Para ti" en 7 días.
export function AiMetricsPanel() {
  const { data, isPending, isError, error, refetch } = useAiMetrics();

  return (
    <section aria-labelledby="ia-vs-reglas" className="mt-5 overflow-hidden rounded-card border border-white/[0.06] bg-panel">
      <div className="border-b border-white/[0.06] px-4 py-4 md:px-[22px] md:py-[18px]">
        <h2 id="ia-vs-reglas" className="font-display text-[15px] font-semibold text-ink">
          Recomendaciones IA vs reglas
        </h2>
        <p className="mt-0.5 text-xs text-ink-muted">Prueba A/B de “Para ti”: cada persona ve siempre la misma variante</p>
      </div>

      <div className="p-4 md:px-[22px]">
        {isPending && (
          <div className="flex flex-col gap-2" aria-busy="true" aria-label="Cargando métricas">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-7" />
            ))}
          </div>
        )}

        {isError && <ErrorState message={error.message} onRetry={refetch} />}

        {data && !hasData(data) && (
          <EmptyState
            size="sm"
            icon={SparklesIcon}
            title="Aún no hay datos de la prueba."
            description="Aparecen cuando la gente abre “Para ti” en Descubre."
          />
        )}

        {data && hasData(data) && (
          <>
            <table className="w-full text-left text-[13px]">
              <caption className="sr-only">Comparación entre la variante de reglas y la de IA</caption>
              <thead>
                <tr className="text-xs text-ink-muted">
                  <th scope="col" className="pb-2 font-semibold">
                    <span className="sr-only">Métrica</span>
                  </th>
                  <th scope="col" className="pb-2 text-right font-semibold">
                    Reglas
                  </th>
                  <th scope="col" className="pb-2 text-right font-semibold text-accent-soft">
                    IA
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows(data).map(([label, rules, ai]) => (
                  <tr key={label} className="border-t border-white/5">
                    <th scope="row" className="py-2 font-normal text-ink-muted">
                      {label}
                    </th>
                    <td className="py-2 text-right text-ink tabular-nums">{rules}</td>
                    <td className="py-2 text-right font-semibold text-ink tabular-nums">{ai}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-ink-muted">{sourceLine(data.ai.bySource)}</p>
            {isSmallSample(data) && (
              <p className="mt-1.5 text-xs text-ink-muted">
                Muestra pequeña (menos de 30 personas por variante): léelo como un estudio exploratorio.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
