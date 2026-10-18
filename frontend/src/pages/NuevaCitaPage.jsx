import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeftIcon, ClockIcon } from '../components/icons/index.js';
import { MAX_INVITEES, ParticipantPicker } from '../components/appointments/ParticipantPicker.jsx';
import { appointmentFormSchema, toSlotPayload } from '../lib/appointment-schemas.js';
import { bookableSlots, isWithinSlot, suggestedRange } from '../lib/appointments.js';
import { formatTime, isoToBogotaInput } from '../lib/format.js';
import { useAvailability, useCreateAppointment } from '../hooks/useAppointments.js';
import { Button, EmptyState, ErrorState, Input, LinkButton, OptionCard, Skeleton, Textarea, useToast } from '../components/ui/index.js';

const API_FIELDS = ['title', 'notes', 'location', 'startsAt', 'endsAt'];

const slotDay = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'America/Bogota' });
const slotTitle = (slot) => {
  const text = slotDay.format(new Date(slot.startsAt));
  return text.charAt(0).toUpperCase() + text.slice(1);
};
const slotHours = (slot) => `${formatTime(slot.startsAt)} – ${formatTime(slot.endsAt)}`;

function SlotPicker({ slots, selectedId, onSelect, error }) {
  return (
    <div className="flex flex-col gap-2" role="group" aria-labelledby="franja-label" aria-describedby={error ? 'franja-error' : undefined}>
      <p id="franja-label" className="text-xs font-semibold text-ink-muted">
        Franja de tu disponibilidad
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {slots.map((slot) => (
          <OptionCard
            key={slot.id}
            icon={ClockIcon}
            title={slotTitle(slot)}
            description={slotHours(slot)}
            selected={slot.id === selectedId}
            onClick={() => onSelect(slot)}
          />
        ))}
      </div>
      {error && (
        <p id="franja-error" role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
      <Link to="/disponibilidad" className="focus-ring self-start rounded text-xs font-semibold text-accent hover:text-accent-soft">
        Agregar otra franja
      </Link>
    </div>
  );
}

function AppointmentForm({ slots }) {
  const navigate = useNavigate();
  const toast = useToast();
  const createAppointment = useCreateAppointment();
  const [invitees, setInvitees] = useState([]);
  const [inviteesError, setInviteesError] = useState('');
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(appointmentFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { slotId: '', title: '', notes: '', location: '', startsAt: '', endsAt: '' },
  });
  const slot = slots.find((s) => s.id === watch('slotId'));

  function selectSlot(next) {
    const range = suggestedRange(next);
    setValue('slotId', next.id, { shouldValidate: true });
    setValue('startsAt', range.startsAt, { shouldValidate: true });
    setValue('endsAt', range.endsAt, { shouldValidate: true });
  }

  // Los invitados no van en el formulario de react-hook-form: se revisan junto con los demás campos
  function checkInvitees() {
    if (invitees.length === 0) setInviteesError('Elige al menos un invitado');
  }

  function submit(values) {
    const payload = toSlotPayload(values);
    if (!isWithinSlot(payload, slot)) {
      const field = new Date(payload.startsAt) < new Date(slot.startsAt) || new Date(payload.startsAt) >= new Date(slot.endsAt) ? 'startsAt' : 'endsAt';
      setError(field, { message: `Debe quedar dentro de la franja (${slotHours(slot)})` }, { shouldFocus: true });
      return;
    }
    if (invitees.length === 0) return checkInvitees();
    createAppointment.mutate(
      {
        title: values.title,
        notes: values.notes,
        location: values.location,
        ...payload,
        participantIds: invitees.map((p) => p.id),
      },
      {
        onSuccess: () => {
          toast.success('Cita agendada. Avisamos a tus invitados.');
          navigate('/citas');
        },
        onError: (err) => {
          const details = err.details ?? [];
          details.filter((d) => API_FIELDS.includes(d.field)).forEach((d) => setError(d.field, { message: d.message }));
          const inviteeIssue = details.find((d) => d.field.startsWith('participantIds'));
          if (inviteeIssue) setInviteesError(inviteeIssue.message);
          if (!details.length) toast.error(err.message);
        },
      },
    );
  }

  const bounds = slot ? { min: isoToBogotaInput(slot.startsAt), max: isoToBogotaInput(slot.endsAt) } : {};

  return (
    <form onSubmit={handleSubmit(submit, checkInvitees)} noValidate className="flex flex-col gap-5">
      <Input label="Título" placeholder="Ej.: Reunión de capitanes" error={errors.title?.message} {...register('title')} />

      <SlotPicker slots={slots} selectedId={slot?.id} onSelect={selectSlot} error={errors.slotId?.message} />

      {slot && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Inicio" type="datetime-local" step={900} {...bounds} hint="Hora de Colombia" error={errors.startsAt?.message} {...register('startsAt')} />
          <Input label="Fin" type="datetime-local" step={900} {...bounds} error={errors.endsAt?.message} {...register('endsAt')} />
        </div>
      )}

      <Input label="Lugar (opcional)" placeholder="Ej.: Cafetería del coliseo" error={errors.location?.message} {...register('location')} />
      <Textarea label="Notas (opcional)" rows={3} error={errors.notes?.message} {...register('notes')} />

      <ParticipantPicker
        selected={invitees}
        error={inviteesError}
        onAdd={(p) => {
          setInviteesError('');
          setInvitees((current) => (current.length >= MAX_INVITEES ? current : [...current, p]));
        }}
        onRemove={(id) => setInvitees((current) => current.filter((p) => p.id !== id))}
      />

      <Button type="submit" loading={createAppointment.isPending} className="sm:min-w-48 sm:self-end">
        Agendar cita
      </Button>
    </form>
  );
}

// /citas/nueva (RF-14): título, franja de disponibilidad con horario dentro de ella, lugar, notas e invitados
export default function NuevaCitaPage() {
  const { data, isPending, isError, error, refetch } = useAvailability();
  const slots = data ? bookableSlots(data) : [];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link
        to="/citas"
        className="focus-ring inline-flex min-h-11 items-center gap-1 self-start rounded-field text-sm font-semibold text-accent hover:text-accent-soft"
      >
        <ChevronLeftIcon size={16} /> Volver a citas
      </Link>
      <div>
        <h1 className="font-display text-[21px] font-semibold text-ink md:text-[22px]">Nueva cita</h1>
        <p className="mt-1 text-sm text-ink-muted">Avisaremos a cada invitado por correo y en Avisos.</p>
      </div>

      {isPending && (
        <div aria-busy="true" aria-label="Cargando tu disponibilidad" className="flex flex-col gap-4">
          <Skeleton className="h-12" />
          <div className="grid gap-2 sm:grid-cols-2">
            <Skeleton className="h-[74px]" />
            <Skeleton className="h-[74px]" />
          </div>
          <Skeleton className="h-12" />
        </div>
      )}
      {isError && <ErrorState message={error.message} onRetry={refetch} />}
      {data && slots.length === 0 && (
        <EmptyState
          icon={ClockIcon}
          title="Primero marca tu disponibilidad."
          description="Las citas se agendan dentro de tus franjas libres. Agrega una y vuelve aquí."
          action={
            <LinkButton to="/disponibilidad" size="sm">
              Marcar disponibilidad
            </LinkButton>
          }
        />
      )}
      {slots.length > 0 && <AppointmentForm slots={slots} />}
    </div>
  );
}
