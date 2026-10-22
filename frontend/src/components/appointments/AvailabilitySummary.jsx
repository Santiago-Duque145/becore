import { useAvailability } from '../../hooks/useAppointments.js';
import { formatRange } from '../../lib/appointments.js';
import { LinkButton, Skeleton } from '../ui/index.js';

const MAX_ITEMS = 4;

// Resumen de la disponibilidad del organizador en /citas: próximos bloques y acceso a gestionarlos
export function AvailabilitySummary() {
  const { data, isPending, isError, refetch } = useAvailability();
  const slots = data ?? [];

  return (
    <section aria-labelledby="mi-disponibilidad" className="rounded-card border border-white/[0.06] bg-panel p-5">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 id="mi-disponibilidad" className="font-display text-sm font-semibold text-ink">
          Tu disponibilidad
        </h2>
        {slots.length > 0 && (
          <span className="text-xs text-ink-muted tabular-nums">
            {slots.length} {slots.length === 1 ? 'franja' : 'franjas'}
          </span>
        )}
      </div>
      {isPending && (
        <div className="mb-4 flex flex-col gap-2">
          <Skeleton className="h-5" />
          <Skeleton className="h-5" />
        </div>
      )}
      {isError && (
        <p className="mb-4 text-xs text-ink-muted">
          No pudimos cargar tus franjas.{' '}
          <button type="button" onClick={() => refetch()} className="focus-ring rounded font-semibold text-accent hover:text-accent-soft">
            Reintentar
          </button>
        </p>
      )}
      {!isPending && !isError && slots.length === 0 && (
        <p className="mb-4 text-xs text-ink-muted">Aún no marcas franjas libres. Las necesitas para agendar citas.</p>
      )}
      {slots.length > 0 && (
        <ul className="mb-4 flex flex-col gap-2">
          {slots.slice(0, MAX_ITEMS).map((slot) => (
            <li key={slot.id} className="text-[12.5px] text-ink first-letter:uppercase">
              {formatRange(slot.startsAt, slot.endsAt)}
            </li>
          ))}
          {slots.length > MAX_ITEMS && <li className="text-xs text-ink-muted">y {slots.length - MAX_ITEMS} más</li>}
        </ul>
      )}
      <LinkButton to="/disponibilidad" variant="secondary" size="sm" className="w-full">
        Gestionar disponibilidad
      </LinkButton>
    </section>
  );
}
