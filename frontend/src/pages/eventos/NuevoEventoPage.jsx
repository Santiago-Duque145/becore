import { useNavigate } from 'react-router';
import { useCreateEvent } from '../../hooks/useEvent.js';
import { EventForm } from '../../components/events/EventForm.jsx';
import { useToast } from '../../components/ui/index.js';
import { LOCATION_MISSING_NOTICE, hasCoordinates } from '../../lib/map.js';

const ACTIONS = [
  { intent: 'draft', label: 'Guardar borrador', variant: 'secondary' },
  { intent: 'publish', label: 'Publicar', variant: 'primary' },
];

export default function NuevoEventoPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const createEvent = useCreateEvent();

  async function handleSubmit(payload, intent) {
    const publish = intent === 'publish';
    const event = await createEvent.mutateAsync({ ...payload, status: publish ? 'published' : 'draft' });
    toast.success(publish ? 'Evento publicado.' : 'Guardamos el borrador. Solo tú lo ves.');
    if (!hasCoordinates(event)) toast.info(LOCATION_MISSING_NOTICE);
    navigate(`/eventos/${event.id}`);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-5 font-display text-xl font-semibold text-ink md:text-[22px]">Crear evento</h1>
      <EventForm assistant actions={ACTIONS} onSubmit={handleSubmit} onCancel={() => navigate(-1)} />
    </div>
  );
}
