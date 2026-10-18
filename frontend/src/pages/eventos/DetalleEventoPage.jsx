import { useParams } from 'react-router';
import { AlertCircleIcon, CalendarIcon, MapPinIcon } from '../../components/icons/index.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useEvent } from '../../hooks/useEvent.js';
import { useRealtimeEvent } from '../../hooks/useRealtimeEvent.js';
import { endLabel } from '../../lib/event-time.js';
import { formatLongDay, formatTime } from '../../lib/format.js';
import { AttendanceButton } from '../../components/events/AttendanceButton.jsx';
import { DetailCover, DetailSkeleton, InfoRow } from '../../components/events/EventDetailParts.jsx';
import { AvatarStack } from '../../components/events/AvatarStack.jsx';
import { RateBanner } from '../../components/events/RateBanner.jsx';
import { RatingBadge } from '../../components/events/RatingBadge.jsx';
import { OwnerActions } from '../../components/events/OwnerActions.jsx';
import { Avatar, CapacityBar, EmptyState, ErrorState, LinkButton } from '../../components/ui/index.js';

// /eventos/:id según mobile-detalle-evento.html, sin distancia, "Ver ruta", chat ni mapa (CLAUDE.md §9).
// Móvil: pantalla completa (AppShell inmersivo) con barra de acción fija abajo.
// Escritorio: columna centrada de 720 px y la barra de acción al final de la columna.
export default function DetalleEventoPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const { data: event, isPending, isError, error, refetch } = useEvent(id);
  useRealtimeEvent(id);

  if (isPending) return <DetailSkeleton />;
  if (isError) {
    return (
      <div className="mx-auto max-w-[720px] px-[22px] pt-16 md:px-0 md:pt-0">
        {error.code === 'EVENT_NOT_FOUND' ? (
          <EmptyState
            title="No encontramos este evento"
            description="Puede que lo hayan borrado o que el enlace esté mal."
            action={
              <LinkButton to="/descubre" variant="secondary" size="sm">
                Volver a Descubre
              </LinkButton>
            }
          />
        ) : (
          <ErrorState message={error.message} onRetry={refetch} />
        )}
      </div>
    );
  }

  const isOwner = event.organizer?.id === profile?.id;
  const showAttendance = !isOwner && profile?.role === 'participant' && event.status !== 'draft';
  const hasActionBar = isOwner || showAttendance;
  // Activo: "7:00 p. m. · Termina aprox. 9:00 p. m. (2 h por defecto)"; finalizado/cancelado: solo el rango
  const finishLabel = endLabel(event);
  const timeRange = finishLabel
    ? `${formatTime(event.startsAt)} · ${finishLabel}`
    : event.endsAt
      ? `${formatTime(event.startsAt)} — ${formatTime(event.endsAt)}`
      : formatTime(event.startsAt);

  return (
    <article className="mx-auto w-full max-w-[720px]">
      <DetailCover event={event} />

      <div className={hasActionBar ? 'px-[22px] pt-[22px] pb-36 md:px-0 md:pb-0' : 'px-[22px] py-[22px] md:px-0'}>
        <h1 className="mb-3.5 font-display text-[21px] font-semibold text-ink md:text-[22px]">{event.title}</h1>

        {event.status === 'cancelled' && (
          <p
            role="status"
            className="mb-4 flex items-start gap-2 rounded-field border border-action/30 bg-action/10 p-3.5 text-[13px] font-semibold text-action"
          >
            <AlertCircleIcon size={16} className="mt-px shrink-0" />
            Este evento fue cancelado. Ya no se realiza.
          </p>
        )}

        <InfoRow icon={CalendarIcon} main={formatLongDay(event.startsAt)} sub={timeRange} />
        <InfoRow icon={MapPinIcon} main={event.location} />

        <div className="mt-1.5 mb-4 rounded-[14px] border border-white/[0.06] bg-panel px-4 py-3.5">
          <CapacityBar
            confirmedCount={event.confirmedCount}
            capacity={event.capacity}
            live={event.status === 'published' || event.status === 'in_progress'}
          />
        </div>

        {event.description && (
          <p className="mb-4 text-[13px] leading-[1.55] whitespace-pre-line text-ink/80">{event.description}</p>
        )}

        <p className="mb-[18px] flex items-center gap-3 text-[11.5px] text-ink-muted">
          <AvatarStack people={event.confirmedPreview} total={event.confirmedCount} />
          {event.confirmedCount === 1 ? '1 persona confirmada' : `${event.confirmedCount} personas confirmadas`}
          <RatingBadge event={event} />
        </p>

        <RateBanner event={event} className="mb-[18px]" />

        <div className="flex items-center gap-2.5 pt-1">
          <Avatar name={event.organizer?.fullName} decorative />
          <div>
            <p className="text-[12.5px] font-semibold text-ink">{event.organizer?.fullName}</p>
            <p className="text-[11px] text-ink-muted">Organizador</p>
          </div>
        </div>

        {hasActionBar && (
          <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2.5 border-t border-white/[0.06] bg-bg px-[22px] pt-4 pb-[max(24px,env(safe-area-inset-bottom))] md:static md:z-auto md:mt-7 md:border-t md:px-0 md:pt-6 md:pb-0">
            {isOwner ? <OwnerActions event={event} /> : <AttendanceButton event={event} />}
          </div>
        )}
      </div>
    </article>
  );
}
