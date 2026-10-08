import { useState } from 'react';
import { toast } from 'sonner';
import { CalendarClock, MapPin, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useAppointments, useCancelAppointment } from '../hooks/useAppointments.js';
import { formatDate } from '../lib/format.js';
import { Button, LinkButton } from '../components/ui/Button.jsx';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback.jsx';
import { Modal } from '../components/ui/Modal.jsx';

const TABS = [
  ['upcoming', 'Próximas'],
  ['past', 'Pasadas'],
];

function AppointmentCard({ appointment, isOwner, onCancel }) {
  const cancelled = appointment.status === 'cancelled';
  return (
    <li className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-lg font-semibold text-navy-900">{appointment.title}</h2>
        {cancelled && (
          <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-semibold text-white">Cancelada</span>
        )}
      </div>
      <p className="flex items-center gap-2 text-navy-900">
        <CalendarClock size={16} className="text-teal-600" aria-hidden="true" />
        <span className="capitalize">{formatDate(appointment.startsAt)}</span>
      </p>
      {appointment.location && (
        <p className="flex items-center gap-2 text-gray-500">
          <MapPin size={16} aria-hidden="true" /> {appointment.location}
        </p>
      )}
      <p className="flex items-start gap-2 text-gray-500">
        <Users size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          {isOwner
            ? appointment.participants.map((p) => p.fullName).join(', ')
            : `Organiza ${appointment.organizer.fullName}`}
        </span>
      </p>
      {appointment.notes && <p className="whitespace-pre-line text-sm text-gray-500">{appointment.notes}</p>}
      {isOwner && !cancelled && (
        <Button variant="danger" className="self-start" onClick={() => onCancel(appointment)}>
          Cancelar cita
        </Button>
      )}
    </li>
  );
}

export default function CitasPage() {
  const { profile } = useAuth();
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
        <h1 className="font-display text-2xl font-bold text-navy-900">Mis citas</h1>
        {isOrganizer && (
          <div className="flex flex-wrap gap-2">
            <LinkButton to="/disponibilidad" variant="secondary">
              Mi disponibilidad
            </LinkButton>
            <LinkButton to="/citas/nueva">Nueva cita</LinkButton>
          </div>
        )}
      </div>

      <div role="tablist" aria-label="Citas" className="flex gap-2">
        {TABS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={scope === value}
            onClick={() => setScope(value)}
            className={`min-h-[44px] rounded-xl px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 ${scope === value ? 'bg-navy-900 text-white' : 'bg-white text-navy-900'}`}
          >
            {label}
          </button>
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
          action={isOrganizer && scope === 'upcoming' ? <LinkButton to="/citas/nueva">Crear una cita</LinkButton> : undefined}
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
        <p className="mb-5 text-gray-500">Avisaremos por correo a los invitados.</p>
        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
          <Button variant="secondary" onClick={() => setToCancel(null)}>
            Mantener cita
          </Button>
          <Button variant="danger" onClick={handleCancel} disabled={cancelAppointment.isPending}>
            {cancelAppointment.isPending ? 'Cancelando…' : 'Sí, cancelar cita'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
