import { useCallback, useState } from 'react';
import { useCancelEvent, usePublishEvent } from '../../hooks/useEvent.js';
import { Button, LinkButton, Modal, useToast } from '../ui/index.js';
import { FinishEventButton } from './FinishEventButton.jsx';

// Acciones del organizador dueño en la barra del detalle (en lugar del botón de asistencia)
export function OwnerActions({ event }) {
  const toast = useToast();
  const cancelEvent = useCancelEvent(event.id);
  const publishEvent = usePublishEvent(event.id);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const closeDialog = useCallback(() => setConfirmingCancel(false), []);

  const isActive = ['draft', 'published', 'in_progress'].includes(event.status);
  const canModify = isActive && !event.isPast;
  const isDraft = event.status === 'draft';

  function handleCancel() {
    cancelEvent.mutate(undefined, {
      onSuccess: () => toast.success('Cancelaste el evento.'),
      onError: (err) => toast.error(err.message),
      onSettled: closeDialog,
    });
  }

  function handlePublish() {
    publishEvent.mutate(undefined, {
      onSuccess: () => toast.success('Evento publicado.'),
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <div className="flex w-full flex-col gap-2.5" role="group" aria-label="Acciones del organizador">
      {event.status === 'in_progress' && <FinishEventButton event={event} className="w-full" />}
      {isDraft && canModify && (
        <Button onClick={handlePublish} loading={publishEvent.isPending} className="w-full">
          Publicar evento
        </Button>
      )}
      <LinkButton to={`/eventos/${event.id}/asistentes`} variant={isDraft || event.status === 'in_progress' ? 'secondary' : 'primary'} className="w-full">
        Ver asistentes / check-in
      </LinkButton>
      {canModify && (
        <div className="grid grid-cols-2 gap-2.5">
          <LinkButton to={`/eventos/${event.id}/editar`} variant="secondary">
            Editar
          </LinkButton>
          <Button variant="danger" onClick={() => setConfirmingCancel(true)}>
            Cancelar evento
          </Button>
        </div>
      )}

      <Modal open={confirmingCancel} title="¿Cancelar este evento?" onClose={closeDialog}>
        <p className="mb-5 text-sm text-ink-muted">
          El evento quedará cancelado y esta acción no se puede deshacer. Avisaremos a los confirmados.
        </p>
        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
          <Button variant="secondary" onClick={closeDialog}>
            Mantener evento
          </Button>
          <Button variant="danger" onClick={handleCancel} loading={cancelEvent.isPending}>
            Sí, cancelar evento
          </Button>
        </div>
      </Modal>
    </div>
  );
}
