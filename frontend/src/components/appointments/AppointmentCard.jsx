import { ClockIcon, MapPinIcon, UsersIcon } from '../icons/index.js';
import { Badge } from '../ui/index.js';
import { appointmentStatus, formatRange, inviteesSummary } from '../../lib/appointments.js';
import { cn } from '../../lib/cn.js';

const dayFormatter = new Intl.DateTimeFormat('es-CO', { day: 'numeric', timeZone: 'America/Bogota' });
const monthFormatter = new Intl.DateTimeFormat('es-CO', { month: 'short', timeZone: 'America/Bogota' });

// Fila de cita con el mismo estilo de Mis eventos: fecha destacada, título, horario · lugar y estado.
// Toda la fila abre el detalle.
export function AppointmentCard({ appointment, isOwner, onOpen }) {
  const status = appointmentStatus(appointment);
  const cancelled = appointment.status === 'cancelled';
  const start = new Date(appointment.startsAt);
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(appointment)}
        aria-haspopup="dialog"
        className="focus-ring flex w-full items-start gap-3 rounded-[14px] border border-white/[0.06] bg-panel px-3.5 py-[13px] text-left transition-colors hover:border-line"
      >
        <span
          aria-hidden="true"
          className={cn(
            'flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[10px] text-[11px] leading-[1.2] font-bold uppercase',
            cancelled ? 'bg-field text-ink-muted' : 'bg-accent/12 text-accent-soft',
          )}
        >
          <span>{dayFormatter.format(start)}</span>
          <span>{monthFormatter.format(start).replace('.', '')}</span>
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[13.5px] font-semibold text-ink">{appointment.title}</span>
          <span className="flex items-start gap-1.5 text-[11.5px] text-ink-muted">
            <ClockIcon size={12} className="mt-0.5 shrink-0" />
            <span className="min-w-0 first-letter:uppercase">{formatRange(appointment.startsAt, appointment.endsAt)}</span>
          </span>
          {appointment.location && (
            <span className="flex items-center gap-1.5 text-[11.5px] text-ink-muted">
              <MapPinIcon size={12} className="shrink-0" />
              <span className="min-w-0 truncate">{appointment.location}</span>
            </span>
          )}
          <span className="flex items-start gap-1.5 text-[11.5px] text-ink-muted">
            <UsersIcon size={12} className="mt-0.5 shrink-0" />
            <span className="min-w-0 truncate">
              {isOwner ? inviteesSummary(appointment.participants) : `Te invitó ${appointment.organizer.fullName}`}
            </span>
          </span>
        </span>
        <Badge tone={status.tone} className="shrink-0">
          {status.label}
        </Badge>
      </button>
    </li>
  );
}
