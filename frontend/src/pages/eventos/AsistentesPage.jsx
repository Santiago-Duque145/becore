import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useEvent } from '../../hooks/useEvent.js';
import { useAttendees, useSetCheckIn } from '../../hooks/useAttendees.js';
import { formatDate } from '../../lib/format.js';
import { Input } from '../../components/ui/Field.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Feedback.jsx';

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
      className={`relative inline-flex h-11 w-16 shrink-0 items-center rounded-full px-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-emerald-500' : 'bg-gray-200'}`}
    >
      <span className={`h-8 w-8 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : ''}`} />
    </button>
  );
}

export default function AsistentesPage() {
  const { id } = useParams();
  const { profile } = useAuth();
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
  const term = search.trim().toLowerCase();
  const visible = confirmed.filter((a) => a.fullName.toLowerCase().includes(term));

  function handleChange(attendee, checkedIn) {
    setCheckIn.mutate(
      { userId: attendee.userId, checkedIn },
      { onError: (err) => toast.error(err.message) },
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link to={`/eventos/${id}`} className="inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-teal-600">
        <ArrowLeft size={16} aria-hidden="true" /> Volver al evento
      </Link>
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold text-navy-900">Asistentes</h1>
        <p className="text-gray-500">{event.data.title}</p>
        <p className="font-display text-lg font-semibold text-navy-900" aria-live="polite">
          Llegaron {arrived} de {confirmed.length}
        </p>
      </header>

      {!checkInOpen && (
        <p role="status" className="flex items-start gap-2 rounded-xl bg-orange-500/10 p-4 text-navy-900">
          <Clock size={18} className="mt-0.5 shrink-0 text-orange-500" aria-hidden="true" />
          <span>
            {active ? (
              <>
                El check-in se habilita 2 horas antes del evento:{' '}
                <span className="font-medium">{formatDate(opensAt.toISOString())}</span>.
              </>
            ) : (
              'El check-in solo está disponible en eventos publicados o en curso.'
            )}
          </span>
        </p>
      )}

      {confirmed.length > 0 && (
        <Input
          label="Buscar por nombre"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ej. María"
        />
      )}

      {confirmed.length === 0 && (
        <EmptyState title="Aún no hay confirmados." description="Cuando alguien confirme su asistencia aparecerá aquí." />
      )}
      {confirmed.length > 0 && visible.length === 0 && <EmptyState title="Nadie coincide con esa búsqueda." />}

      {visible.length > 0 && (
        <ul className="flex flex-col divide-y divide-gray-200 rounded-2xl bg-white shadow-sm">
          {visible.map((a) => (
            <li key={a.userId} className="flex items-center justify-between gap-3 px-4 py-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-navy-900">{a.fullName}</p>
                <p className="truncate text-sm text-gray-500">{a.email}</p>
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
