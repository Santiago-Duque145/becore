import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { availabilityFormSchema, toSlotPayload } from '../lib/appointment-schemas.js';
import { formatDate } from '../lib/format.js';
import { useAvailability, useCreateAvailability, useDeleteAvailability } from '../hooks/useAppointments.js';
import { Input } from '../components/ui/Field.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback.jsx';
import { Modal } from '../components/ui/Modal.jsx';

function SlotForm() {
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
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-navy-900">Agregar bloque</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Desde" type="datetime-local" hint="Hora de Colombia" error={errors.startsAt?.message} {...register('startsAt')} />
        <Input label="Hasta" type="datetime-local" hint="Máximo 8 horas" error={errors.endsAt?.message} {...register('endsAt')} />
      </div>
      <Button type="submit" disabled={createSlot.isPending} className="md:self-end">
        {createSlot.isPending ? 'Guardando…' : 'Agregar bloque'}
      </Button>
    </form>
  );
}

export default function DisponibilidadPage() {
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
      <h1 className="font-display text-2xl font-bold text-navy-900">Mi disponibilidad</h1>
      <p className="text-gray-500">Marca los momentos en que puedes reunirte. Úsalos como guía al crear una cita.</p>

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
        <ul className="flex flex-col divide-y divide-gray-200 rounded-2xl bg-white shadow-sm">
          {slots.map((slot) => (
            <li key={slot.id} className="flex items-center justify-between gap-3 px-4 py-2">
              <p className="text-navy-900">
                <span className="capitalize">{formatDate(slot.startsAt)}</span>
                <span className="text-gray-500"> → {formatDate(slot.endsAt)}</span>
              </p>
              <Button variant="danger" aria-label="Eliminar bloque" onClick={() => setToDelete(slot)}>
                <Trash2 size={18} aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={Boolean(toDelete)} title="¿Eliminar este bloque?" onClose={() => setToDelete(null)}>
        <p className="mb-5 text-gray-500">Dejará de aparecer en tu lista de disponibilidad.</p>
        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
          <Button variant="secondary" onClick={() => setToDelete(null)}>
            Conservar
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleteSlot.isPending}>
            {deleteSlot.isPending ? 'Eliminando…' : 'Sí, eliminar'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
