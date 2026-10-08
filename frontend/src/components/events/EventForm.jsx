import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { eventFormSchema, formValuesToPayload } from '../../lib/event-schema.js';
import { CATEGORY_OPTIONS } from '../../lib/format.js';
import { Input, Select, Textarea } from '../ui/Field.jsx';
import { Button } from '../ui/Button.jsx';

const FIELDS = ['title', 'description', 'category', 'location', 'startsAt', 'endsAt', 'capacity'];

export const EMPTY_EVENT_VALUES = {
  title: '',
  description: '',
  category: '',
  location: '',
  startsAt: '',
  endsAt: '',
  capacity: '',
};

// onSubmit(payload) debe devolver una promesa; si rechaza con un error de la API,
// se muestra bajo el campo correspondiente (details) o como aviso.
export function EventForm({ initialValues = EMPTY_EVENT_VALUES, submitLabel, onSubmit, onCancel }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(eventFormSchema), defaultValues: initialValues });

  async function submit(values) {
    try {
      await onSubmit(formValuesToPayload(values));
    } catch (error) {
      const fieldErrors = (error.details ?? []).filter((d) => FIELDS.includes(d.field));
      fieldErrors.forEach((d) => setError(d.field, { message: d.message }));
      if (error.code === 'CAPACITY_BELOW_CONFIRMED') setError('capacity', { message: error.message });
      else if (!fieldErrors.length) toast.error(error.message);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
      <Input label="Título" error={errors.title?.message} {...register('title')} />
      <Textarea label="Descripción (opcional)" error={errors.description?.message} {...register('description')} />
      <Select label="Categoría" error={errors.category?.message} {...register('category')}>
        <option value="">Elige una categoría</option>
        {CATEGORY_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <Input label="Lugar" error={errors.location?.message} {...register('location')} />
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Inicio"
          type="datetime-local"
          hint="Hora de Colombia"
          error={errors.startsAt?.message}
          {...register('startsAt')}
        />
        <Input label="Fin (opcional)" type="datetime-local" error={errors.endsAt?.message} {...register('endsAt')} />
      </div>
      <Input
        label="Cupo máximo"
        type="number"
        inputMode="numeric"
        min={1}
        max={1000}
        error={errors.capacity?.message}
        {...register('capacity')}
      />
      <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
