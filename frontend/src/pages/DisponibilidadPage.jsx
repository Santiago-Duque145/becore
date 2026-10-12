import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TrashIcon } from '../components/icons/index.js';
import { availabilityFormSchema, toSlotPayload } from '../lib/appointment-schemas.js';
import { formatDate } from '../lib/format.js';
import { useAvailability, useCreateAvailability, useDeleteAvailability } from '../hooks/useAppointments.js';
import { Button, EmptyState, ErrorState, Input, Modal, Skeleton, useToast } from '../components/ui/index.js';

function SlotForm() {
  const toast = useToast();
  const createSlot = useCreateAvailability();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(availabilityFormSchema), defaultValues: { startsAt: '', endsAt: '' } });

  function submit(values) {
    createSlot.mutate(toSlotPayload(values), {
      onSuccess: () => {
        toast.success('Bloque agregado.');
        reset();
      },
      onError: (err) => {
        (err.details ?? []).forEach((d) => setError(d.field, { message: d.message }));
        if (!err.details?.length) toast.error(err.message);
      },
    });
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="flex flex-col gap-4 rounded-card border border-line bg-panel p-5"
    >
      <h2 className="font-display text-base font-semibold text-ink">Agregar bloque</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Desde" type="datetime-local" hint="Hora de Colombia" error={errors.startsAt?.message} {...register('startsAt')} />
        <Input label="Hasta" type="datetime-local" hint="Máximo 8 horas" error={errors.endsAt?.message} {...register('endsAt')} />
      </div>
      <Button type="submit" loading={createSlot.isPending} className="md:self-end">
        Agregar bloque
      </Button>
    </form>
  );
}

export default function DisponibilidadPage() {
  const toast = useToast();
  const { data: slots, isPending, isError, error, refetch } = useAvailability();
  const deleteSlot = useDeleteAvailability();
  const [toDelete, setToDelete] = useState(null);

  function handleDelete() {
    deleteSlot.mutate(toDelete.id, {
      onSuccess: () => toast.success('Bloque eliminado.'),
      onError: (err) => toast.error(err.message),
      onSettled: () => setToDelete(null),
    });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <h1 className="font-display text-xl font-semibold text-ink md:text-[22px]">Mi disponibilidad</h1>
      <p className="text-sm text-ink-muted">Marca los momentos en que puedes reunirte. Úsalos como guía al crear una cita.</p>

      <SlotForm />

      {isPending && (
        <div aria-busy="true" className="flex flex-col gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      )}
      {isError && <ErrorState message={error.message} onRetry={refetch} />}
      {slots?.length === 0 && (
        <EmptyState title="Aún no tienes bloques próximos." description="Agrega el primero con el formulario de arriba." />
      )}
      {slots?.length > 0 && (
        <ul className="flex flex-col divide-y divide-line rounded-card border border-line bg-panel">
          {slots.map((slot) => (
            <li key={slot.id} className="flex items-center justify-between gap-3 px-4 py-2">
              <p className="text-sm text-ink">
                <span className="capitalize">{formatDate(slot.startsAt)}</span>
                <span className="text-ink-muted"> → {formatDate(slot.endsAt)}</span>
              </p>
              <Button variant="danger" size="sm" aria-label="Eliminar bloque" onClick={() => setToDelete(slot)}>
                <TrashIcon size={18} />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={Boolean(toDelete)} title="¿Eliminar este bloque?" onClose={() => setToDelete(null)}>
        <p className="mb-5 text-sm text-ink-muted">Dejará de aparecer en tu lista de disponibilidad.</p>
        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
          <Button variant="secondary" onClick={() => setToDelete(null)}>
            Conservar
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleteSlot.isPending}>
            Sí, eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
