import { useCallback, useState } from 'react';
import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeftIcon, ClockIcon, TrashIcon } from '../components/icons/index.js';
import { FormAlert } from '../components/auth/FormAlert.jsx';
import { availabilityFormSchema, toAvailabilityPayload } from '../lib/appointment-schemas.js';
import { bogotaToday, findOverlap, formatRange, groupSlotsByDay } from '../lib/appointments.js';
import { formatTime } from '../lib/format.js';
import { useAvailability, useCreateAvailability, useDeleteAvailability } from '../hooks/useAppointments.js';
import { Button, EmptyState, ErrorState, Input, Modal, Skeleton, useToast } from '../components/ui/index.js';

// Se avisa antes de enviar con las franjas ya cargadas; la API también lo impide (409 SLOT_OVERLAP,
// p. ej. si otra pestaña agregó una franja) y su mensaje se muestra en el mismo aviso
function SlotForm({ slots }) {
  const toast = useToast();
  const createSlot = useCreateAvailability();
  const [overlapMessage, setOverlapMessage] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(availabilityFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { date: '', startTime: '', endTime: '' },
  });

  function submit(values) {
    const payload = toAvailabilityPayload(values);
    const overlap = findOverlap(payload, slots);
    if (overlap) {
      setOverlapMessage(
        `Ese horario se cruza con otra de tus franjas. Elige otro o borra primero la del ${formatRange(overlap.startsAt, overlap.endsAt)}`,
      );
      return;
    }
    setOverlapMessage('');
    createSlot.mutate(payload, {
      onSuccess: () => {
        toast.success('Franja agregada.');
        reset({ date: getValues('date'), startTime: '', endTime: '' });
      },
      onError: (err) => {
        const known = (err.details ?? []).filter((d) => d.field === 'startsAt' || d.field === 'endsAt');
        if (err.code === 'SLOT_OVERLAP') setOverlapMessage(err.message);
        else if (known.length) setOverlapMessage(known.map((d) => d.message).join(' · '));
        else toast.error(err.message);
      },
    });
  }

  const clearOverlap = { onChange: () => overlapMessage && setOverlapMessage('') };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      aria-labelledby="nueva-franja"
      className="flex flex-col gap-4 rounded-card border border-line bg-panel p-5"
    >
      <h2 id="nueva-franja" className="font-display text-base font-semibold text-ink">
        Agregar franja
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Fecha"
          type="date"
          min={bogotaToday()}
          error={errors.date?.message}
          {...register('date', clearOverlap)}
        />
        <Input
          label="Hora de inicio"
          type="time"
          step={900}
          error={errors.startTime?.message}
          {...register('startTime', clearOverlap)}
        />
        <Input
          label="Hora de fin"
          type="time"
          step={900}
          hint="Máximo 8 horas"
          error={errors.endTime?.message}
          {...register('endTime', clearOverlap)}
        />
      </div>
      <FormAlert>{overlapMessage}</FormAlert>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-muted">Hora de Colombia. Una franja no puede cruzarse con otra.</p>
        <Button type="submit" loading={createSlot.isPending} className="sm:min-w-44">
          Agregar franja
        </Button>
      </div>
    </form>
  );
}

function SlotList({ slots, onDelete }) {
  return (
    <div className="flex flex-col gap-4">
      {groupSlotsByDay(slots).map((group) => (
        <section key={group.key} aria-label={group.label}>
          <h3 className="mb-2 text-xs font-semibold text-ink-muted">{group.label}</h3>
          <ul className="flex flex-col divide-y divide-line rounded-card border border-white/[0.06] bg-panel">
            {group.slots.map((slot) => (
              <li key={slot.id} className="flex items-center justify-between gap-3 py-1.5 pr-1.5 pl-4">
                <p className="flex items-center gap-2 text-sm text-ink">
                  <ClockIcon size={14} className="shrink-0 text-accent-soft" />
                  {formatTime(slot.startsAt)} – {formatTime(slot.endsAt)}
                </p>
                <Button
                  variant="danger"
                  size="sm"
                  aria-label={`Borrar la franja de ${formatRange(slot.startsAt, slot.endsAt)}`}
                  onClick={() => onDelete(slot)}
                >
                  <TrashIcon size={18} />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

// /disponibilidad (RF-15): franjas libres del organizador. Las citas se agendan dentro de ellas.
export default function DisponibilidadPage() {
  const toast = useToast();
  const { data: slots, isPending, isError, error, refetch } = useAvailability();
  const deleteSlot = useDeleteAvailability();
  const [toDelete, setToDelete] = useState(null);
  const closeDialog = useCallback(() => setToDelete(null), []);

  function handleDelete() {
    deleteSlot.mutate(toDelete.id, {
      onSuccess: () => toast.success('Franja borrada.'),
      onError: (err) => toast.error(err.message),
      onSettled: closeDialog,
    });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link
        to="/citas"
        className="focus-ring inline-flex min-h-11 items-center gap-1 self-start rounded-field text-sm font-semibold text-accent hover:text-accent-soft"
      >
        <ChevronLeftIcon size={16} /> Volver a citas
      </Link>
      <div>
        <h1 className="font-display text-[21px] font-semibold text-ink md:text-[22px]">Mi disponibilidad</h1>
        <p className="mt-1 text-sm text-ink-muted">Marca cuándo puedes reunirte. Tus citas se agendan dentro de estas franjas.</p>
      </div>

      <SlotForm slots={slots ?? []} />

      <section aria-labelledby="mis-franjas" className="flex flex-col gap-3">
        <h2 id="mis-franjas" className="font-display text-base font-semibold text-ink">
          Próximas franjas
        </h2>
        {isPending && (
          <div aria-busy="true" aria-label="Cargando franjas" className="flex flex-col gap-3">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        )}
        {isError && <ErrorState message={error.message} onRetry={refetch} />}
        {slots?.length === 0 && (
          <EmptyState
            icon={ClockIcon}
            title="Aún no tienes franjas libres."
            description="Agrega la primera con el formulario de arriba y luego agenda tus citas."
          />
        )}
        {slots?.length > 0 && <SlotList slots={slots} onDelete={setToDelete} />}
      </section>

      <Modal open={Boolean(toDelete)} title="¿Borrar esta franja?" onClose={closeDialog}>
        {toDelete && (
          <p className="mb-5 text-sm text-ink-muted first-letter:uppercase">
            {formatRange(toDelete.startsAt, toDelete.endsAt)}. Dejará de estar disponible para nuevas citas; las citas ya
            agendadas no cambian.
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
          <Button variant="secondary" onClick={closeDialog} disabled={deleteSlot.isPending}>
            Conservar
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleteSlot.isPending}>
            Sí, borrar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
