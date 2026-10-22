import { useCallback, useState } from 'react';
import { CalendarIcon, ClockIcon, MapPinIcon, UserIcon, UsersIcon } from '../icons/index.js';
import { Badge, Button, Modal, useToast } from '../ui/index.js';
import { useCancelAppointment } from '../../hooks/useAppointments.js';
import { appointmentStatus } from '../../lib/appointments.js';
import { formatLongDay, formatTime } from '../../lib/format.js';

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-field bg-field text-accent-soft">
        <Icon size={16} />
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="text-[11px] font-semibold text-ink-muted">{label}</p>
        <div className="text-sm text-ink">{children}</div>
      </div>
    </div>
  );
}

function Details({ appointment, isOwner }) {
  const names = appointment.participants.map((p) => p.fullName).join(', ');
  return (
    <div className="flex flex-col gap-3.5">
      <DetailRow icon={CalendarIcon} label="Fecha">
        {formatLongDay(appointment.startsAt)}
      </DetailRow>
      <DetailRow icon={ClockIcon} label="Hora (Colombia)">
        {formatTime(appointment.startsAt)} – {formatTime(appointment.endsAt)}
      </DetailRow>
      <DetailRow icon={MapPinIcon} label="Lugar">
        {appointment.location || <span className="text-ink-muted">Sin lugar definido</span>}
      </DetailRow>
      {!isOwner && (
        <DetailRow icon={UserIcon} label="Organiza">
          {appointment.organizer.fullName}
        </DetailRow>
      )}
      <DetailRow icon={UsersIcon} label={`Invitados (${appointment.participants.length})`}>
        {names}
      </DetailRow>
      {appointment.notes && (
        <div className="rounded-field border border-line bg-field px-4 py-3">
          <p className="mb-1 text-[11px] font-semibold text-ink-muted">Notas</p>
          <p className="text-sm whitespace-pre-line text-ink">{appointment.notes}</p>
        </div>
      )}
    </div>
  );
}

// Detalle de una cita en un diálogo. El organizador la cancela desde aquí, con un segundo paso de
// confirmación dentro del mismo diálogo (el foco no se pierde entre dos modales).
export function AppointmentDetailModal({ appointment, isOwner, onClose }) {
  const toast = useToast();
  const cancelAppointment = useCancelAppointment();
  const [confirming, setConfirming] = useState(false);
  // Modal vuelve a enfocar el panel si cambia onClose: los manejadores deben ser estables
  const close = useCallback(() => {
    setConfirming(false);
    onClose();
  }, [onClose]);
  const backToDetail = useCallback(() => setConfirming(false), []);
  if (!appointment) return null;

  const status = appointmentStatus(appointment);
  const ended = new Date(appointment.endsAt).getTime() <= Date.now();
  const canCancel = isOwner && appointment.status === 'scheduled' && !ended;
  const invitees = appointment.participants.length;

  function handleCancel() {
    cancelAppointment.mutate(appointment.id, {
      onSuccess: () => {
        toast.success('Cancelaste la cita. Avisamos a los invitados.');
        close();
      },
      onError: (err) => toast.error(err.message),
    });
  }

  if (confirming) {
    return (
      <Modal open title="¿Cancelar esta cita?" onClose={backToDetail}>
        <p className="mb-5 text-sm text-ink-muted">
          «{appointment.title}» quedará cancelada. Avisaremos {invitees === 1 ? 'a tu invitado' : `a tus ${invitees} invitados`}{' '}
          por correo y en Avisos. No se puede deshacer.
        </p>
        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
          <Button variant="secondary" onClick={backToDetail} disabled={cancelAppointment.isPending}>
            Mantener cita
          </Button>
          <Button variant="danger" onClick={handleCancel} loading={cancelAppointment.isPending}>
            Sí, cancelar cita
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open title={appointment.title} onClose={close}>
      <Badge tone={status.tone} className="mb-4">
        {status.label}
      </Badge>
      <Details appointment={appointment} isOwner={isOwner} />
      <div className="mt-6 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
        <Button variant="secondary" onClick={close}>
          Cerrar
        </Button>
        {canCancel && (
          <Button variant="danger" onClick={() => setConfirming(true)}>
            Cancelar cita
          </Button>
        )}
      </div>
    </Modal>
  );
}
