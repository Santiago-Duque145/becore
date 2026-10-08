import { useState } from 'react';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useCancelAttendance, useConfirmAttendance } from '../../hooks/useAttendance.js';
import { Button } from '../ui/Button.jsx';
import { Modal } from '../ui/Modal.jsx';

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

export function AttendanceButton({ event, compact = false }) {
  const { profile } = useAuth();
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
        <span className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-500/15 px-4 font-semibold text-navy-900">
          <Check size={18} className="text-emerald-500" aria-hidden="true" /> Vas a ir
        </span>
        {state === 'confirmed' && (
          <Button variant="danger" onClick={() => setConfirmingCancel(true)} disabled={cancel.isPending}>
            Cancelar asistencia
          </Button>
        )}
        <Modal open={confirmingCancel} title="¿Cancelar tu asistencia?" onClose={() => setConfirmingCancel(false)}>
          <p className="mb-5 text-gray-500">Liberarás tu cupo para que otra persona pueda ir.</p>
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

  if (state === 'available') {
    return (
      <Button onClick={handleConfirm} disabled={confirm.isPending} className={compact ? 'w-full' : 'w-full md:w-auto'}>
        {confirm.isPending ? 'Confirmando…' : 'Confirmar asistencia'}
      </Button>
    );
  }

  return (
    <Button disabled className={compact ? 'w-full' : 'w-full md:w-auto'}>
      {DISABLED_LABELS[state]}
    </Button>
  );
}
