import { capacityState } from '../ui/CapacityBar.jsx';
import { MusicIcon, SparklesIcon, TreeIcon, TrophyIcon } from '../icons/index.js';

// Reglas de presentación del panel del organizador (desktop-panel-organizador.html)

export const CATEGORY_STYLE = {
  sport: { Icon: TrophyIcon, box: 'bg-accent/15 text-accent-soft' },
  culture: { Icon: MusicIcon, box: 'bg-culture/15 text-culture' },
  recreation: { Icon: TreeIcon, box: 'bg-success/15 text-success' },
  other: { Icon: SparklesIcon, box: 'bg-ink-muted/15 text-ink-muted' },
};

// Estado de la fila: [texto, tono de Badge]
export function eventRowStatus(event) {
  if (event.status === 'cancelled') return ['Cancelado', 'action'];
  if (event.status === 'draft') return ['Borrador', 'neutral'];
  if (event.status === 'finished' || (event.isPast && event.status !== 'in_progress')) return ['Finalizado', 'neutral'];
  if (event.status === 'in_progress') return ['En curso', 'success'];
  const state = capacityState(event.confirmedCount, event.capacity);
  if (state === 'full') return ['Lleno', 'neutral'];
  if (state === 'almost_full') return ['Casi lleno', 'culture'];
  return ['Activo', 'success'];
}

// Editable: borrador o publicado que aún no empieza (mismas reglas que el backend)
export const canEditEvent = (event) => (event.status === 'draft' || event.status === 'published') && !event.isPast;

const WEEK_MS = 7 * 24 * 3600 * 1000;

// Etiquetas bajo cada métrica, calculadas con los datos del panel (sin cifras inventadas)
export function statTags({ totals, events }, now = Date.now()) {
  const active = events.filter((e) => e.status !== 'cancelled' && e.status !== 'draft' && !e.isPast);
  const thisWeek = active.filter((e) => new Date(e.startsAt).getTime() - now < WEEK_MS).length;
  const almostFull = active.filter((e) => capacityState(e.confirmedCount, e.capacity) !== 'open').length;
  return {
    active: thisWeek === 1 ? '1 esta semana' : `${thisWeek} esta semana`,
    confirmed: totals.checkedIn === 1 ? '1 llegó' : `${totals.checkedIn} llegaron`,
    occupancy: almostFull === 1 ? '1 evento casi lleno' : `${almostFull} eventos casi llenos`,
    cancelled: 'últimos 30 días',
  };
}
