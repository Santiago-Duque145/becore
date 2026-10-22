// P8 · Un solo mensaje de estado por tarjeta, siempre con datos reales (nunca urgencias falsas). Función pura.
// Prioridad: "Es hoy" / "Es mañana" → "¡Quedan N cupos!" (≤ 20 % y ≤ 5) → "Se está llenando" (≥ 70 %) → "Nuevo" (< 48 h).
// "En curso", "Lleno", "Cancelado", "Finalizado" y "Pasado" ya los muestra StatusBadges: con ellos no hay mensaje.

const BOGOTA_OFFSET_MS = 5 * 3600 * 1000; // Colombia: UTC-5 todo el año
const DAY_MS = 24 * 3600 * 1000;
export const FEW_SPOTS_RATIO = 0.2;
export const FEW_SPOTS_MAX = 5;
export const FILLING_RATIO = 0.7;
export const NEW_FOR_MS = 48 * 3600 * 1000;

const bogotaDay = (date) => Math.floor((new Date(date).getTime() - BOGOTA_OFFSET_MS) / DAY_MS);

// → { kind: 'today' | 'tomorrow' | 'few_spots' | 'filling' | 'new', label, tone: 'action' | 'culture' } o null
// mine: la lista es de eventos a los que ya voy ("Mis eventos"): solo importa cuándo es
export function cardHighlight(event, { now = new Date(), mine = false } = {}) {
  const start = new Date(event.startsAt).getTime();
  if (event.status !== 'published' || event.isFull || start <= now.getTime()) return null;

  const days = bogotaDay(start) - bogotaDay(now);
  if (days === 0) return { kind: 'today', label: 'Es hoy', tone: 'action' };
  if (days === 1) return { kind: 'tomorrow', label: 'Es mañana', tone: 'action' };
  if (mine || event.myAttendance?.status === 'confirmed') return null;

  const { capacity, confirmedCount } = event;
  if (capacity > 0) {
    const left = capacity - confirmedCount;
    if (left >= 1 && left <= FEW_SPOTS_MAX && left / capacity <= FEW_SPOTS_RATIO) {
      return { kind: 'few_spots', label: left === 1 ? '¡Queda 1 cupo!' : `¡Quedan ${left} cupos!`, tone: 'action' };
    }
    if (confirmedCount / capacity >= FILLING_RATIO) return { kind: 'filling', label: 'Se está llenando', tone: 'action' };
  }
  if (event.createdAt && now.getTime() - new Date(event.createdAt).getTime() < NEW_FOR_MS) {
    return { kind: 'new', label: 'Nuevo', tone: 'culture' };
  }
  return null;
}
