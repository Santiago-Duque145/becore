// Reglas de presentación de citas y disponibilidad (F2-1). Puras para poder probarlas.
// Las comprobaciones de cruces y de franja son ayudas de la interfaz para avisar antes de enviar:
// la regla la impone la base (SLOT_OVERLAP, APPOINTMENT_OUTSIDE_SLOT, APPOINTMENT_OVERLAP, api.md §2).
import { bogotaInputToIso, formatLongDay, formatTime, isoToBogotaInput } from './format.js';

const QUARTER_MS = 15 * 60 * 1000;
const HOUR_MS = 3600 * 1000;

const slotDayFormatter = new Intl.DateTimeFormat('es-CO', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'America/Bogota',
});

// Estado de la cita como Badge. Nunca solo color: siempre con texto.
export function appointmentStatus(appointment, now = new Date()) {
  if (appointment.status === 'cancelled') return { label: 'Cancelada', tone: 'action' };
  const nowMs = now.getTime();
  if (new Date(appointment.endsAt).getTime() <= nowMs) return { label: 'Realizada', tone: 'neutral' };
  if (new Date(appointment.startsAt).getTime() <= nowMs) return { label: 'En curso', tone: 'success' };
  return { label: 'Programada', tone: 'accent' };
}

// "jue, 23 oct · 3:00 p. m. – 5:00 p. m."
export function formatRange(startsAt, endsAt) {
  const day = slotDayFormatter.format(new Date(startsAt));
  return `${day} · ${formatTime(startsAt)} – ${formatTime(endsAt)}`;
}

// Fecha (YYYY-MM-DD) y hora (HH:mm) de Bogotá → ISO UTC
export const bogotaPartsToIso = (date, time) => bogotaInputToIso(`${date}T${time}`);

// Hoy en Bogotá como YYYY-MM-DD (mínimo del selector de fecha)
export const bogotaToday = (now = new Date()) => isoToBogotaInput(now.toISOString()).slice(0, 10);

// Primer bloque que se cruza con [startsAt, endsAt). Bloques que solo se tocan no se cruzan.
export function findOverlap({ startsAt, endsAt }, slots) {
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  return (
    slots.find((slot) => start < new Date(slot.endsAt).getTime() && new Date(slot.startsAt).getTime() < end) ?? null
  );
}

export function isWithinSlot({ startsAt, endsAt }, slot) {
  return (
    new Date(startsAt).getTime() >= new Date(slot.startsAt).getTime() &&
    new Date(endsAt).getTime() <= new Date(slot.endsAt).getTime()
  );
}

// Horario sugerido al elegir un bloque: desde el inicio (o el próximo cuarto de hora si ya empezó)
// y una hora de duración, sin salirse del bloque. Valores para <input type="datetime-local">.
export function suggestedRange(slot, now = new Date()) {
  const slotStart = new Date(slot.startsAt).getTime();
  const slotEnd = new Date(slot.endsAt).getTime();
  const nextQuarter = Math.ceil((now.getTime() + 1) / QUARTER_MS) * QUARTER_MS;
  const start = Math.max(slotStart, nextQuarter);
  const end = Math.min(slotEnd, start + HOUR_MS);
  return {
    startsAt: isoToBogotaInput(new Date(start).toISOString()),
    endsAt: isoToBogotaInput(new Date(end).toISOString()),
  };
}

// Bloques donde todavía cabe una cita (terminan después del próximo cuarto de hora)
export function bookableSlots(slots, now = new Date()) {
  const nextQuarter = Math.ceil((now.getTime() + 1) / QUARTER_MS) * QUARTER_MS;
  return slots.filter((slot) => new Date(slot.endsAt).getTime() > nextQuarter);
}

// Agrupa bloques por día de Bogotá conservando el orden: [{ key, label, slots }]
export function groupSlotsByDay(slots) {
  const groups = [];
  for (const slot of slots) {
    const key = isoToBogotaInput(slot.startsAt).slice(0, 10);
    let group = groups.at(-1);
    if (group?.key !== key) {
      group = { key, label: formatLongDay(slot.startsAt), slots: [] };
      groups.push(group);
    }
    group.slots.push(slot);
  }
  return groups;
}

// "Jugador 1 y Jugador 2" · "Jugador 1, Jugador 2 y 3 más"
export function inviteesSummary(participants, maxNames = 2) {
  const names = participants.map((p) => p.fullName);
  if (names.length <= maxNames) return names.join(' y ');
  return `${names.slice(0, maxNames).join(', ')} y ${names.length - maxNames} más`;
}
