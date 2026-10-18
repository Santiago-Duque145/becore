import { useId, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { AppointmentList } from '../components/appointments/AppointmentList.jsx';
import { AvailabilitySummary } from '../components/appointments/AvailabilitySummary.jsx';
import { Chip, LinkButton } from '../components/ui/index.js';
import { PlusIcon } from '../components/icons/index.js';

const TABS = [
  ['upcoming', 'Próximas'],
  ['past', 'Pasadas'],
];

function emptyFor(scope, isOrganizer) {
  if (scope === 'past') {
    return { title: 'Aún no tienes citas pasadas.', description: 'Aquí verás las reuniones que ya ocurrieron.' };
  }
  if (!isOrganizer) {
    return {
      title: 'No tienes citas próximas.',
      description: 'Cuando un organizador te invite a una reunión, aparecerá aquí y en Avisos.',
    };
  }
  return {
    title: 'No tienes citas próximas.',
    description: 'Marca tus franjas libres y agenda una reunión con tus participantes.',
    action: (
      <LinkButton to="/citas/nueva" variant="secondary" size="sm">
        Agendar cita
      </LinkButton>
    ),
  };
}

// /citas: citas donde soy organizador o invitado. El organizador ve además su disponibilidad y crea citas.
export default function CitasPage() {
  const { profile } = useAuth();
  const [scope, setScope] = useState('upcoming');
  const panelId = useId();
  const isOrganizer = profile?.role === 'organizer';

  const list = (
    <div className="flex min-w-0 flex-col gap-4">
      <div role="tablist" aria-label="Periodo" className="flex gap-2">
        {TABS.map(([value, label]) => (
          <Chip key={value} role="tab" aria-controls={panelId} selected={scope === value} onClick={() => setScope(value)}>
            {label}
          </Chip>
        ))}
      </div>
      <div id={panelId} role="tabpanel" aria-label={scope === 'upcoming' ? 'Próximas' : 'Pasadas'}>
        <AppointmentList scope={scope} viewerId={profile?.id} empty={emptyFor(scope, isOrganizer)} />
      </div>
    </div>
  );

  return (
    <div className={isOrganizer ? 'flex flex-col gap-5' : 'mx-auto flex max-w-2xl flex-col gap-5'}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[21px] font-semibold text-ink md:text-[22px]">Citas</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {isOrganizer ? 'Reuniones con tus participantes.' : 'Reuniones a las que te invitaron.'}
          </p>
        </div>
        {isOrganizer && (
          <LinkButton to="/citas/nueva" size="sm" className="px-4">
            <PlusIcon size={16} /> Nueva cita
          </LinkButton>
        )}
      </div>

      {isOrganizer ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="lg:order-2">
            <AvailabilitySummary />
          </div>
          <div className="lg:order-1">{list}</div>
        </div>
      ) : (
        list
      )}
    </div>
  );
}
