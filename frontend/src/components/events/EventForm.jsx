import { useId, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CAPACITY_MAX,
  CAPACITY_MIN,
  DESCRIPTION_MAX,
  DURATION_OPTIONS,
  durationLabel,
  eventFormSchema,
  formValuesToPayload,
} from '../../lib/event-schema.js';
import { bogotaInputToIso } from '../../lib/format.js';
import { Button, Field, Input, Select, Textarea, useToast } from '../ui/index.js';
import { CapacityStepper, CategoryPicker } from './EventFormControls.jsx';
import { EventCard } from './EventCard.jsx';

const FIELDS = ['title', 'description', 'category', 'location', 'startsAt', 'endsAt', 'capacity'];

export const EMPTY_EVENT_VALUES = {
  title: '',
  description: '',
  category: '',
  location: '',
  startsAt: '',
  durationMinutes: '',
  capacity: '20',
};

// Tarjeta de vista previa con lo que lleva escrito el organizador
function previewEvent(values) {
  let startsAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
  try {
    if (values.startsAt) startsAt = new Date(bogotaInputToIso(values.startsAt)).toISOString();
  } catch {
    /* fecha a medio escribir: se deja la de ejemplo */
  }
  return {
    id: 'vista-previa',
    title: values.title.trim() || 'Título del evento',
    category: values.category || 'other',
    location: values.location.trim() || 'Lugar del evento',
    startsAt,
    capacity: Number(values.capacity) || 0,
    confirmedCount: 0,
    status: 'published',
    isFull: false,
    isPast: false,
    myAttendance: null,
  };
}

// Crear/editar evento (R8). actions: [{ intent, label, variant }] → onSubmit(payload, intent).
// Validación al salir de cada campo (skill §4). Si la API rechaza, el error va bajo su campo.
export function EventForm({
  initialValues = EMPTY_EVENT_VALUES,
  actions,
  onSubmit,
  onCancel,
  keepDuration = false,
}) {
  const toast = useToast();
  const capacityId = useId();
  const {
    register,
    control,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(eventFormSchema),
    defaultValues: initialValues,
    mode: 'onTouched',
  });
  const values = watch();
  // Qué botón envió (borrador / publicar / guardar): se fija al hacer clic, antes del submit
  const intentRef = useRef(actions.at(-1).intent);
  const [pendingIntent, setPendingIntent] = useState(null);
  const descriptionLength = values.description?.length ?? 0;
  const initialDuration = Number(initialValues.durationMinutes);
  const extraDuration =
    initialDuration && !DURATION_OPTIONS.some((o) => Number(o.value) === initialDuration);

  async function submit(formValues) {
    const intent = intentRef.current;
    setPendingIntent(intent);
    try {
      await onSubmit(formValuesToPayload(formValues), intent);
    } catch (error) {
      const fieldErrors = (error.details ?? []).filter((d) => FIELDS.includes(d.field));
      fieldErrors.forEach((d) =>
        setError(d.field === 'endsAt' ? 'durationMinutes' : d.field, { message: d.message }),
      );
      if (error.code === 'CAPACITY_BELOW_CONFIRMED')
        setError('capacity', { message: error.message });
      else if (!fieldErrors.length) toast.error(error.message);
    } finally {
      setPendingIntent(null);
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <form
        onSubmit={handleSubmit(submit)}
        className="min-w-0 flex-1 rounded-card border border-line bg-panel p-5"
        noValidate
      >
        <Field label="Título" error={errors.title?.message}>
          <Input placeholder="Ej.: Torneo barrial de fútbol" {...register('title')} />
        </Field>

        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <CategoryPicker
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.category?.message}
            />
          )}
        />

        <div className="grid gap-x-4 md:grid-cols-2">
          <Field label="Fecha y hora" hint="Hora de Colombia" error={errors.startsAt?.message}>
            <Input type="datetime-local" {...register('startsAt')} />
          </Field>
          <Field label="Duración (opcional)" error={errors.durationMinutes?.message}>
            <Select {...register('durationMinutes')}>
              {!keepDuration && <option value="">Sin definir</option>}
              {extraDuration && (
                <option value={initialValues.durationMinutes}>
                  {durationLabel(initialDuration)}
                </option>
              )}
              {DURATION_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Lugar" error={errors.location?.message}>
          <Input placeholder="Ej.: Cancha La Floresta, Medellín" {...register('location')} />
        </Field>

        <Field
          label="Cupo máximo"
          id={capacityId}
          hint={`Entre ${CAPACITY_MIN} y ${CAPACITY_MAX} personas`}
          error={errors.capacity?.message}
        >
          <Controller
            name="capacity"
            control={control}
            render={({ field }) => (
              <CapacityStepper
                id={capacityId}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                min={CAPACITY_MIN}
                max={CAPACITY_MAX}
                invalid={Boolean(errors.capacity)}
                describedBy={errors.capacity ? `${capacityId}-error` : `${capacityId}-hint`}
              />
            )}
          />
        </Field>

        <Field
          label="Descripción (opcional)"
          hint={`${descriptionLength} / ${DESCRIPTION_MAX}`}
          error={errors.description?.message}
        >
          <Textarea
            rows={4}
            maxLength={DESCRIPTION_MAX}
            placeholder="Qué llevar, a qué hora llegar…"
            {...register('description')}
          />
        </Field>

        <div className="mt-2 flex flex-col-reverse gap-3 md:flex-row md:justify-end">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
          )}
          {actions.map(({ intent, label, variant }) => (
            <Button
              key={intent}
              type="submit"
              onClick={() => (intentRef.current = intent)}
              variant={variant}
              disabled={isSubmitting}
              loading={pendingIntent === intent}
            >
              {label}
            </Button>
          ))}
        </div>
      </form>

      <aside className="w-full lg:sticky lg:top-24 lg:w-[300px]" aria-label="Vista previa">
        <p className="mb-2.5 text-xs font-semibold text-ink-muted">
          Así lo verán los participantes
        </p>
        <EventCard event={previewEvent(values)} preview />
      </aside>
    </div>
  );
}
