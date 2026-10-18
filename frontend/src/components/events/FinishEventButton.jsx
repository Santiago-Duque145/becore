import { useCallback, useState } from 'react';
import { useFinishEvent } from '../../hooks/useEvent.js';
import { Button, Modal, useToast } from '../ui/index.js';

// "Finalizar evento" para el organizador cuando está En curso (detalle y panel).
// Confirma en un diálogo accesible: al finalizar, quienes hicieron check-in pueden calificarlo.
export function FinishEventButton({ event, size = 'md', variant = 'primary', className }) {
  const toast = useToast();
  const finishEvent = useFinishEvent(event.id);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  function handleFinish() {
    finishEvent.mutate(undefined, {
      onSuccess: () => toast.success('Finalizaste el evento. Los asistentes ya pueden calificarlo.'),
      onError: (err) => toast.error(err.message),
      onSettled: close,
    });
  }

  return (
    <>
      <Button size={size} variant={variant} className={className} onClick={() => setOpen(true)}>
        Finalizar evento
      </Button>
      <Modal open={open} title="¿Terminó el evento?" onClose={close}>
        <p className="mb-5 text-sm text-ink-muted">
          ¿Terminó el evento? Los asistentes con check-in podrán calificarlo. Esta acción no se puede deshacer.
        </p>
        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
          <Button variant="secondary" onClick={close}>
            Todavía no
          </Button>
          <Button onClick={handleFinish} loading={finishEvent.isPending}>
            Sí, finalizar
          </Button>
        </div>
      </Modal>
    </>
  );
}
