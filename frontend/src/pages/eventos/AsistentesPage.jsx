import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ChevronLeftIcon, ClockIcon, SearchIcon } from '../../components/icons/index.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useEvent } from '../../hooks/useEvent.js';
import { useAttendees, useSetCheckIn } from '../../hooks/useAttendees.js';
import { formatDate } from '../../lib/format.js';
import { EmptyState, PreviewableAvatar, ErrorState, Field, Input, Skeleton, useToast } from '../../components/ui/index.js';

// Sin tildes ni mayúsculas, para buscar "maria" y encontrar a "María"
const normalize = (text) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

const CHECKIN_OPENS_MS = 2 * 3600 * 1000;

function CheckInSwitch({ checked, disabled, label, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`focus-ring relative inline-flex h-11 w-16 shrink-0 items-center rounded-full px-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-success' : 'bg-field'}`}
    >
      <span
        className={`h-8 w-8 rounded-full bg-ink shadow transition-transform motion-reduce:transition-none ${checked ? 'translate-x-6' : ''}`}
      />
    </button>
  );
}

export default function AsistentesPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const toast = useToast();
  const event = useEvent(id);
  const attendees = useAttendees(id);
  const setCheckIn = useSetCheckIn(id);
  const [search, setSearch] = useState('');

  if (event.isPending || attendees.isPending) return <Skeleton className="mx-auto h-96 max-w-2xl" />;
  if (event.isError) return <ErrorState message={event.error.message} onRetry={event.refetch} />;
  if (event.data.organizer.id !== profile?.id) {
    return <ErrorState message="Solo el organizador de este evento puede ver los asistentes." />;
  }
  if (attendees.isError) return <ErrorState message={attendees.error.message} onRetry={attendees.refetch} />;

  const confirmed = attendees.data.filter((a) => a.status === 'confirmed');
  const arrived = confirmed.filter((a) => a.checkedIn).length;
  const opensAt = new Date(new Date(event.data.startsAt).getTime() - CHECKIN_OPENS_MS);
  const active = event.data.status === 'published' || event.data.status === 'in_progress';
  const checkInOpen = active && Date.now() >= opensAt.getTime();
  const term = normalize(search);
  const visible = confirmed.filter((a) => normalize(a.fullName).includes(term) || normalize(a.email).includes(term));
  const percent = confirmed.length ? Math.round((arrived / confirmed.length) * 100) : 0;

  function handleChange(attendee, checkedIn) {
    setCheckIn.mutate({ userId: attendee.userId, checkedIn }, { onError: (err) => toast.error(err.message) });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link
        to={`/eventos/${id}`}
        className="focus-ring inline-flex min-h-11 items-center gap-1 self-start rounded-field text-sm font-semibold text-accent hover:text-accent-soft"
      >
        <ChevronLeftIcon size={16} /> Volver al evento
      </Link>
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-xl font-semibold text-ink md:text-[22px]">Asistentes</h1>
        <p className="text-sm text-ink-muted">{event.data.title}</p>
        <div className="mt-2 rounded-[14px] border border-white/[0.06] bg-panel px-4 py-3.5">
          <p className="mb-2 flex items-baseline justify-between text-[12.5px] text-ink-muted" aria-live="polite">
            <span>Check-in</span>
            <span className="font-display text-base font-semibold text-ink tabular-nums">
              {arrived} de {confirmed.length} llegaron
            </span>
          </p>
          <div className="h-[7px] overflow-hidden rounded-full bg-line" aria-hidden="true">
            <div className="h-full rounded-full bg-success transition-[width] duration-200 motion-reduce:transition-none" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </header>

      {!checkInOpen && (
        <p role="status" className="flex items-start gap-2 rounded-field border border-action/30 bg-action/10 p-4 text-sm text-ink">
          <ClockIcon size={18} className="mt-0.5 shrink-0 text-action" />
          <span>
            {active ? (
              <>
                El check-in se habilita 2 horas antes del evento:{' '}
                <span className="font-semibold">{formatDate(opensAt.toISOString())}</span>
              </>
            ) : (
              'El check-in solo está disponible en eventos publicados o en curso.'
            )}
          </span>
        </p>
      )}

      {confirmed.length > 0 && (
        <Field label="Buscar por nombre o correo" flush>
          <Input icon={SearchIcon} type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ej.: María" />
        </Field>
      )}

      {confirmed.length === 0 && (
        <EmptyState title="Aún no hay confirmados." description="Cuando alguien confirme su asistencia aparecerá aquí." />
      )}
      {confirmed.length > 0 && visible.length === 0 && (
        <EmptyState icon={SearchIcon} title="Nadie coincide con esa búsqueda." />
      )}

      {visible.length > 0 && (
        <ul className="flex flex-col divide-y divide-line rounded-card border border-line bg-panel">
          {visible.map((a) => (
            <li key={a.userId} className="flex items-center justify-between gap-3 px-4 py-2">
              <div className="flex min-w-0 items-center gap-3">
                <PreviewableAvatar name={a.fullName} role="participant" src={a.avatarUrl} preset={a.avatarPreset} />
                <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{a.fullName}</p>
                <p className="truncate text-xs text-ink-muted">{a.email}</p>
                </div>
              </div>
              <CheckInSwitch
                checked={a.checkedIn}
                disabled={!checkInOpen}
                label={`Marcar llegada de ${a.fullName}`}
                onChange={(value) => handleChange(a, value)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
