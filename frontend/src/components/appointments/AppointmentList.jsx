import { useCallback, useState } from 'react';
import { ClockIcon } from '../icons/index.js';
import { EmptyState, ErrorState, Skeleton } from '../ui/index.js';
import { useAppointments } from '../../hooks/useAppointments.js';
import { AppointmentCard } from './AppointmentCard.jsx';
import { AppointmentDetailModal } from './AppointmentDetailModal.jsx';

// Lista de citas (GET /appointments?scope=…) con sus estados de carga, vacío y error, y el detalle en un
// diálogo. La usan /citas y la sección "Mis citas" de Mis eventos.
export function AppointmentList({ scope, viewerId, empty, skeletons = 2 }) {
  const { data, isPending, isError, error, refetch } = useAppointments(scope);
  const [openId, setOpenId] = useState(null);
  const closeDetail = useCallback(() => setOpenId(null), []);
  const openAppointment = useCallback((appointment) => setOpenId(appointment.id), []);
  // Se busca en los datos frescos: tras cancelar, el detalle ya no muestra el estado viejo
  const selected = data?.find((a) => a.id === openId) ?? null;

  if (isPending) {
    return (
      <div aria-busy="true" aria-label="Cargando citas" className="flex flex-col gap-3">
        {Array.from({ length: skeletons }, (_, i) => (
          <Skeleton key={i} className="h-[86px]" />
        ))}
      </div>
    );
  }
  if (isError) return <ErrorState message={error.message} onRetry={refetch} />;
  if (data.length === 0) return <EmptyState icon={ClockIcon} {...empty} />;

  return (
    <>
      <ul className="flex flex-col gap-3">
        {data.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            isOwner={appointment.organizer?.id === viewerId}
            onOpen={openAppointment}
          />
        ))}
      </ul>
      <AppointmentDetailModal
        appointment={selected}
        isOwner={selected?.organizer?.id === viewerId}
        onClose={closeDetail}
      />
    </>
  );
}
