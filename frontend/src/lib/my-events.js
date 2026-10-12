// Reglas de presentación de "Mis eventos" y "Avisos" (R7). Puras para poder probarlas.

const BOGOTA_OFFSET_MS = 5 * 3600 * 1000; // Colombia: UTC-5 todo el año
const DAY_MS = 24 * 3600 * 1000;

// Estado de mi asistencia como Badge: [texto, tono]
export function myEventStatus(event) {
  if (event.status === 'cancelled') return { label: 'Evento cancelado', tone: 'action' };
  if (event.myAttendance?.status === 'cancelled') return { label: 'Cancelado', tone: 'neutral' };
  if (event.myAttendance?.checkedIn) return { label: 'Asistió', tone: 'accent' };
  return { label: 'Confirmado', tone: 'success' };
}

// Día calendario de Bogotá como número de días desde la época
const bogotaDay = (date) => Math.floor((new Date(date).getTime() - BOGOTA_OFFSET_MS) / DAY_MS);

// Agrupa los avisos en Hoy / Esta semana (últimos 7 días) / Antes, sin grupos vacíos
export function groupNotifications(items, now = new Date()) {
  const today = bogotaDay(now);
  const groups = [
    { key: 'hoy', label: 'Hoy', items: [] },
    { key: 'semana', label: 'Esta semana', items: [] },
    { key: 'antes', label: 'Antes', items: [] },
  ];
  for (const item of items) {
    const age = today - bogotaDay(item.createdAt);
    groups[age <= 0 ? 0 : age < 7 ? 1 : 2].items.push(item);
  }
  return groups.filter((g) => g.items.length > 0);
}

// Avisos de cambio sin leer de mis próximos eventos (aviso naranja de mobile-mis-eventos, auditoría d-15)
export function pendingScheduleChanges(notifications, upcomingEvents) {
  const upcomingIds = new Set(upcomingEvents.map((e) => e.id));
  return notifications.filter((n) => n.type === 'event_updated' && !n.readAt && upcomingIds.has(n.eventId));
}
