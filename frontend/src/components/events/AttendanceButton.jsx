import { useState } from 'react';
import { CheckIcon } from '../icons/index.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useCancelAttendance, useConfirmAttendance } from '../../hooks/useAttendance.js';
import { Button, Modal, useToast } from '../ui/index.js';

// Estado de la acción según el evento (ui.md §4). `compact` se usa en las tarjetas.
function resolveState(event) {
  const confirmed = event.myAttendance?.status === 'confirmed';
  const open = event.status === 'published' && !event.isPast;
  if (confirmed) return open ? 'confirmed' : 'confirmed-locked';
  if (event.status === 'cancelled') return 'cancelled';
  if (event.status === 'finished') return 'finished';
  if (!open) return 'started';
  return event.isFull ? 'full' : 'available';
}

const DISABLED_LABELS = {
  full: 'Sin cupos',
  cancelled: 'Evento cancelado',
  finished: 'Evento finalizado',
  started: 'El evento ya empezó',
};

// En las tarjetas, botón pequeño con los textos de desktop-descubre (auditoría d-10)
const COMPACT_DISABLED_LABELS = { ...DISABLED_LABELS, full: 'Cupo lleno', started: 'Ya empezó' };

export function AttendanceButton({ event, compact = false }) {
  const { profile } = useAuth();
  const toast = useToast();
  const confirm = useConfirmAttendance(event.id);
  const cancel = useCancelAttendance(event.id);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  if (profile?.role !== 'participant' || event.status === 'draft') return null;
  const state = resolveState(event);

  function handleConfirm() {
    confirm.mutate(undefined, {
      onSuccess: () => toast.success('¡Listo! Tienes tu cupo.'),
      onError: (err) => toast.error(err.message),
    });
  }

  function handleCancel() {
    setConfirmingCancel(false);
    cancel.mutate(undefined, {
      onSuccess: () => toast.success('Cancelaste tu asistencia. Liberaste un cupo.'),
      onError: (err) => toast.error(err.message),
    });
  }

  if (state === 'confirmed' || state === 'confirmed-locked') {
    // En las tarjetas basta la insignia "Vas a ir"; el detalle ofrece cancelar
    if (compact) return null;
    return (
      <div className="flex flex-col items-start gap-2">
        <span className="inline-flex min-h-12 items-center gap-2 rounded-field bg-success/15 px-4 text-sm font-semibold text-success">
          <CheckIcon size={18} /> Vas a ir
        </span>
        {state === 'confirmed' && (
          <Button variant="danger" onClick={() => setConfirmingCancel(true)} loading={cancel.isPending}>
            Cancelar asistencia
          </Button>
        )}
        <Modal open={confirmingCancel} title="¿Cancelar tu asistencia?" onClose={() => setConfirmingCancel(false)}>
          <p className="mb-5 text-sm text-ink-muted">Liberarás tu cupo para que otra persona pueda ir.</p>
          <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
            <Button variant="secondary" onClick={() => setConfirmingCancel(false)}>
              Mantener cupo
            </Button>
            <Button variant="danger" onClick={handleCancel}>
              Sí, cancelar asistencia
            </Button>
          </div>
        </Modal>
      </div>
    );
  }

  if (compact) {
    return state === 'available' ? (
      <Button
        size="sm"
        onClick={handleConfirm}
        loading={confirm.isPending}
        aria-label={`Confirmar asistencia a ${event.title}`}
      >
        Confirmar
      </Button>
    ) : (
      <Button size="sm" variant="secondary" disabled>
        {COMPACT_DISABLED_LABELS[state]}
      </Button>
    );
  }

  if (state === 'available') {
    return (
      <Button onClick={handleConfirm} loading={confirm.isPending} className="w-full md:w-auto">
        Confirmar asistencia
      </Button>
    );
  }

  return (
    <Button disabled className="w-full md:w-auto">
      {DISABLED_LABELS[state]}
    </Button>
  );
}
