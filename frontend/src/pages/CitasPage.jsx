import { useState } from 'react';
import { CalendarIcon, MapPinIcon, UsersIcon } from '../components/icons/index.js';
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

function AppointmentCard({ appointment, isOwner, onCancel }) {
  const cancelled = appointment.status === 'cancelled';
  return (
    <li className="flex flex-col gap-2 rounded-card border border-line bg-panel p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-[14.5px] font-semibold text-ink">{appointment.title}</h2>
        {cancelled && <Badge tone="action">Cancelada</Badge>}
      </div>
      <p className="flex items-center gap-2 text-sm text-ink">
        <CalendarIcon size={16} className="text-accent-soft" />
        <span className="capitalize">{formatDate(appointment.startsAt)}</span>
      </p>
      {appointment.location && (
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <MapPinIcon size={16} /> {appointment.location}
        </p>
      )}
      <p className="flex items-start gap-2 text-sm text-ink-muted">
        <UsersIcon size={16} className="mt-0.5 shrink-0" />
        <span>
          {isOwner
            ? appointment.participants.map((p) => p.fullName).join(', ')
            : `Organiza ${appointment.organizer.fullName}`}
        </span>
      </p>
      {appointment.notes && <p className="text-sm whitespace-pre-line text-ink-muted">{appointment.notes}</p>}
      {isOwner && !cancelled && (
        <Button variant="danger" size="sm" className="self-start" onClick={() => onCancel(appointment)}>
          Cancelar cita
        </Button>
      )}
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
        <h1 className="font-display text-xl font-semibold text-ink md:text-[22px]">Mis citas</h1>
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
