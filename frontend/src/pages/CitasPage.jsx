import { useState } from 'react';
import { CalendarIcon, UsersIcon } from '../components/icons/index.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useAppointments, useCancelAppointment } from '../hooks/useAppointments.js';
import { formatDate } from '../lib/format.js';
import {
  Badge,
  Button,
  Chip,
  EmptyState,
  ErrorState,
  LinkButton,
  Modal,
  Skeleton,
  useToast,
} from '../components/ui/index.js';

const TABS = [
  ['upcoming', 'Próximas'],
  ['past', 'Pasadas'],
];

const dayFormatter = new Intl.DateTimeFormat('es-CO', { day: 'numeric', timeZone: 'America/Bogota' });
const monthFormatter = new Intl.DateTimeFormat('es-CO', { month: 'short', timeZone: 'America/Bogota' });

// Misma fila que Mis eventos: fecha destacada, título, hora · lugar y estado
function AppointmentCard({ appointment, isOwner, onCancel }) {
  const cancelled = appointment.status === 'cancelled';
  const start = new Date(appointment.startsAt);
  return (
    <li className="flex items-start gap-3 rounded-[14px] border border-white/[0.06] bg-panel px-3.5 py-[13px]">
      <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[10px] bg-accent/12 text-[11px] leading-[1.2] font-bold text-accent-soft uppercase" aria-hidden="true">
        <span>{dayFormatter.format(start)}</span>
        <span>{monthFormatter.format(start).replace('.', '')}</span>
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-[13.5px] font-semibold text-ink">{appointment.title}</h2>
          {cancelled && <Badge tone="action" className="shrink-0">Cancelada</Badge>}
        </div>
        <p className="flex items-center gap-1.5 text-[11.5px] text-ink-muted">
          <CalendarIcon size={12} className="shrink-0" />
          <span className="first-letter:uppercase">{formatDate(appointment.startsAt)}</span>
          {appointment.location && <span className="truncate">· {appointment.location}</span>}
        </p>
        <p className="flex items-start gap-1.5 text-[11.5px] text-ink-muted">
          <UsersIcon size={12} className="mt-0.5 shrink-0" />
          <span>
            {isOwner
              ? appointment.participants.map((p) => p.fullName).join(', ')
              : `Organiza ${appointment.organizer.fullName}`}
          </span>
        </p>
        {appointment.notes && <p className="text-xs whitespace-pre-line text-ink/80">{appointment.notes}</p>}
        {isOwner && !cancelled && (
          <Button variant="danger" size="sm" className="mt-1 self-start" onClick={() => onCancel(appointment)}>
            Cancelar cita
          </Button>
        )}
      </div>
    </li>
  );
}

export default function CitasPage() {
  const { profile } = useAuth();
  const toast = useToast();
  const [scope, setScope] = useState('upcoming');
  const { data, isPending, isError, error, refetch } = useAppointments(scope);
  const cancelAppointment = useCancelAppointment();
  const [toCancel, setToCancel] = useState(null);
  const isOrganizer = profile?.role === 'organizer';

  function handleCancel() {
    cancelAppointment.mutate(toCancel.id, {
      onSuccess: () => toast.success('Cancelaste la cita.'),
      onError: (err) => toast.error(err.message),
      onSettled: () => setToCancel(null),
    });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-[21px] font-semibold text-ink md:text-[22px]">Mis citas</h1>
        {isOrganizer && (
          <div className="flex flex-wrap gap-2">
            <LinkButton to="/disponibilidad" variant="secondary" size="sm">
              Mi disponibilidad
            </LinkButton>
            <LinkButton to="/citas/nueva" size="sm">
              Nueva cita
            </LinkButton>
          </div>
        )}
      </div>

      <div role="tablist" aria-label="Citas" className="flex gap-2">
        {TABS.map(([value, label]) => (
          <Chip key={value} role="tab" selected={scope === value} onClick={() => setScope(value)}>
            {label}
          </Chip>
        ))}
      </div>

      {isPending && (
        <div aria-busy="true" className="flex flex-col gap-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      )}
      {isError && <ErrorState message={error.message} onRetry={refetch} />}
      {data?.length === 0 && (
        <EmptyState
          title={scope === 'upcoming' ? 'No tienes citas próximas.' : 'Aún no tienes citas pasadas.'}
          action={
            isOrganizer && scope === 'upcoming' ? (
              <LinkButton to="/citas/nueva" size="sm">
                Crear una cita
              </LinkButton>
            ) : undefined
          }
        />
      )}
      {data?.length > 0 && (
        <ul className="flex flex-col gap-3">
          {data.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              isOwner={appointment.organizer.id === profile?.id}
              onCancel={setToCancel}
            />
          ))}
        </ul>
      )}

      <Modal open={Boolean(toCancel)} title="¿Cancelar esta cita?" onClose={() => setToCancel(null)}>
        <p className="mb-5 text-sm text-ink-muted">Avisaremos por correo a los invitados.</p>
        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
          <Button variant="secondary" onClick={() => setToCancel(null)}>
            Mantener cita
          </Button>
          <Button variant="danger" onClick={handleCancel} loading={cancelAppointment.isPending}>
            Sí, cancelar cita
          </Button>
        </div>
      </Modal>
    </div>
  );
}
