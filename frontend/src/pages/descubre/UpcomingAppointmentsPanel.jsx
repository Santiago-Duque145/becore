import { Link } from 'react-router';
import { useAppointments } from '../../hooks/useAppointments.js';
import { Skeleton } from '../../components/ui/index.js';

const dayFormatter = new Intl.DateTimeFormat('es-CO', { day: 'numeric', timeZone: 'America/Bogota' });
const monthFormatter = new Intl.DateTimeFormat('es-CO', { month: 'short', timeZone: 'America/Bogota' });
const timeFormatter = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota' });

const MAX_ITEMS = 3;

// Columna derecha de desktop-descubre: "Próximas citas" del usuario (GET /appointments?scope=upcoming)
export function UpcomingAppointmentsPanel() {
  const { data, isPending, isError } = useAppointments('upcoming');
  const items = (data ?? []).filter((a) => a.status !== 'cancelled').slice(0, MAX_ITEMS);

  return (
    <section aria-labelledby="proximas-citas" className="rounded-card border border-white/[0.06] bg-panel p-5">
      <h2 id="proximas-citas" className="mb-3.5 font-display text-sm font-semibold text-ink">
        Próximas citas
      </h2>
      {isPending && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-[42px]" />
          <Skeleton className="h-[42px]" />
        </div>
      )}
      {isError && <p className="text-xs text-ink-muted">No pudimos cargar tus citas.</p>}
      {!isPending && !isError && items.length === 0 && (
        <p className="text-xs text-ink-muted">No tienes citas próximas.</p>
      )}
      {items.length > 0 && (
        <ul>
          {items.map((appointment) => (
            <li key={appointment.id} className="border-t border-white/5 py-3 first:border-t-0 first:pt-0 last:pb-0">
              <Link to="/citas" className="focus-ring flex gap-3 rounded-field">
                <span className="flex h-[42px] w-[42px] shrink-0 flex-col items-center justify-center rounded-[10px] bg-accent/12 text-[11px] leading-tight font-bold text-accent-soft uppercase">
                  <span>{dayFormatter.format(new Date(appointment.startsAt))}</span>
                  <span>{monthFormatter.format(new Date(appointment.startsAt)).replace('.', '')}</span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-ink">{appointment.title}</span>
                  <span className="mt-0.5 block truncate text-[11.5px] text-ink-muted">
                    {timeFormatter.format(new Date(appointment.startsAt))}
                    {appointment.location ? ` · ${appointment.location}` : ''}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
