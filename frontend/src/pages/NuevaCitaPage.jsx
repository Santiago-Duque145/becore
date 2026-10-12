import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeftIcon, XIcon } from '../components/icons/index.js';
import { appointmentFormSchema, toSlotPayload } from '../lib/appointment-schemas.js';
import { formatDate, isoToBogotaInput } from '../lib/format.js';
import { useAvailability, useCreateAppointment, useParticipantSearch } from '../hooks/useAppointments.js';
import { Button, Chip, Input, Textarea, useToast } from '../components/ui/index.js';

const FIELDS = ['title', 'notes', 'location', 'startsAt', 'endsAt', 'participantIds'];

function ParticipantPicker({ selected, onAdd, onRemove, error }) {
  const [text, setText] = useState('');
  const search = useParticipantSearch(text);
  const results = (search.data ?? []).filter((p) => !selected.some((s) => s.id === p.id));

  return (
    <div className="flex flex-col gap-2">
      <Input
        label="Invitados"
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Busca por nombre o correo (mínimo 2 letras)"
        error={error}
      />
      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Invitados elegidos">
          {selected.map((p) => (
            <li
              key={p.id}
              className="inline-flex items-center gap-1 rounded-full bg-accent/15 py-1 pr-1 pl-3 text-xs font-semibold text-accent-soft"
            >
              {p.fullName}
              <button
                type="button"
                aria-label={`Quitar a ${p.fullName}`}
                onClick={() => onRemove(p.id)}
                className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent/20"
              >
                <XIcon size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {search.enabled && (search.isFetching || search.pending) && <p className="text-sm text-ink-muted">Buscando…</p>}
      {search.isError && (
        <p role="alert" className="text-sm text-danger">
          {search.error.message}
        </p>
      )}
      {search.enabled && !search.isFetching && !search.pending && search.data && results.length === 0 && (
        <p className="text-sm text-ink-muted">No encontramos participantes con ese texto.</p>
      )}
      {results.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-field border border-line bg-field">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onAdd(p)}
                className="focus-ring flex min-h-11 w-full flex-col items-start px-4 py-2 text-left hover:bg-panel"
              >
                <span className="text-sm font-semibold text-ink">{p.fullName}</span>
                <span className="text-xs text-ink-muted">{p.email}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function NuevaCitaPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const createAppointment = useCreateAppointment();
  const slots = useAvailability();
  const [selected, setSelected] = useState([]);
  const [participantsError, setParticipantsError] = useState('');
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: { title: '', notes: '', location: '', startsAt: '', endsAt: '' },
  });

  function submit(values) {
    if (selected.length === 0) {
      setParticipantsError('Elige al menos un invitado');
      return;
    }
    setParticipantsError('');
    createAppointment.mutate(
      {
        title: values.title,
        notes: values.notes,
        location: values.location,
        ...toSlotPayload(values),
        participantIds: selected.map((p) => p.id),
      },
      {
        onSuccess: () => {
          toast.success('Cita creada. Avisamos a los invitados.');
          navigate('/citas');
        },
        onError: (err) => {
          const fieldErrors = (err.details ?? []).filter((d) => FIELDS.includes(d.field));
          fieldErrors.forEach((d) => {
            if (d.field === 'participantIds') setParticipantsError(d.message);
            else setError(d.field, { message: d.message });
          });
          if (!fieldErrors.length) toast.error(err.message);
        },
      },
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link
        to="/citas"
        className="focus-ring inline-flex min-h-11 items-center gap-1 self-start rounded-field text-sm font-semibold text-accent hover:text-accent-soft"
      >
        <ChevronLeftIcon size={16} /> Volver a citas
      </Link>
      <h1 className="font-display text-xl font-semibold text-ink md:text-[22px]">Crear cita</h1>

      <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
        <Input label="Título" error={errors.title?.message} {...register('title')} />
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Inicio" type="datetime-local" hint="Hora de Colombia" error={errors.startsAt?.message} {...register('startsAt')} />
          <Input label="Fin" type="datetime-local" error={errors.endsAt?.message} {...register('endsAt')} />
        </div>

        {slots.data?.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-ink-muted">Tus bloques de disponibilidad (toca uno para usarlo)</p>
            <div className="flex flex-wrap gap-2">
              {slots.data.map((slot) => (
                <Chip
                  key={slot.id}
                  aria-pressed={undefined}
                  className="capitalize"
                  onClick={() => {
                    setValue('startsAt', isoToBogotaInput(slot.startsAt), { shouldValidate: true });
                    setValue('endsAt', isoToBogotaInput(slot.endsAt), { shouldValidate: true });
                  }}
                >
                  {formatDate(slot.startsAt)}
                </Chip>
              ))}
            </div>
          </div>
        )}

        <Input label="Lugar (opcional)" error={errors.location?.message} {...register('location')} />
        <Textarea label="Notas (opcional)" error={errors.notes?.message} {...register('notes')} />

        <ParticipantPicker
          selected={selected}
          error={participantsError}
          onAdd={(p) => {
            setParticipantsError('');
            setSelected((current) => (current.length >= 30 ? current : [...current, p]));
          }}
          onRemove={(id) => setSelected((current) => current.filter((p) => p.id !== id))}
        />

        <Button type="submit" loading={createAppointment.isPending} className="md:self-end">
          Crear cita
        </Button>
      </form>
    </div>
  );
}
