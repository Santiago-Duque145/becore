import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, X } from 'lucide-react';
import { appointmentFormSchema, toSlotPayload } from '../lib/appointment-schemas.js';
import { formatDate, isoToBogotaInput } from '../lib/format.js';
import { useAvailability, useCreateAppointment, useParticipantSearch } from '../hooks/useAppointments.js';
import { Input, Textarea } from '../components/ui/Field.jsx';
import { Button } from '../components/ui/Button.jsx';

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
            <li key={p.id} className="inline-flex items-center gap-1 rounded-full bg-teal-500 py-1 pl-3 pr-1 text-sm font-medium text-navy-900">
              {p.fullName}
              <button
                type="button"
                aria-label={`Quitar a ${p.fullName}`}
                onClick={() => onRemove(p.id)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-navy-900/10 focus-visible:outline-2 focus-visible:outline-teal-500"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {search.enabled && (search.isFetching || search.pending) && <p className="text-sm text-gray-500">Buscando…</p>}
      {search.isError && <p role="alert" className="text-sm text-orange-500">{search.error.message}</p>}
      {search.enabled && !search.isFetching && !search.pending && search.data && results.length === 0 && (
        <p className="text-sm text-gray-500">No encontramos participantes con ese texto.</p>
      )}
      {results.length > 0 && (
        <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onAdd(p)}
                className="flex min-h-[44px] w-full flex-col items-start px-3 py-2 text-left hover:bg-gray-200/60 focus-visible:outline-2 focus-visible:outline-teal-500"
              >
                <span className="font-medium text-navy-900">{p.fullName}</span>
                <span className="text-sm text-gray-500">{p.email}</span>
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
      <Link to="/citas" className="inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-teal-600">
        <ArrowLeft size={16} aria-hidden="true" /> Volver a citas
      </Link>
      <h1 className="font-display text-2xl font-bold text-navy-900">Crear cita</h1>

      <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
        <Input label="Título" error={errors.title?.message} {...register('title')} />
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Inicio" type="datetime-local" hint="Hora de Colombia" error={errors.startsAt?.message} {...register('startsAt')} />
          <Input label="Fin" type="datetime-local" error={errors.endsAt?.message} {...register('endsAt')} />
        </div>

        {slots.data?.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-navy-900">Tus bloques de disponibilidad (toca uno para usarlo)</p>
            <div className="flex flex-wrap gap-2">
              {slots.data.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => {
                    setValue('startsAt', isoToBogotaInput(slot.startsAt), { shouldValidate: true });
                    setValue('endsAt', isoToBogotaInput(slot.endsAt), { shouldValidate: true });
                  }}
                  className="min-h-[44px] rounded-xl border border-gray-200 bg-white px-3 text-sm capitalize text-navy-900 hover:bg-gray-200/60 focus-visible:outline-2 focus-visible:outline-teal-500"
                >
                  {formatDate(slot.startsAt)}
                </button>
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

        <Button type="submit" disabled={createAppointment.isPending} className="md:self-end">
          {createAppointment.isPending ? 'Creando…' : 'Crear cita'}
        </Button>
      </form>
    </div>
  );
}

