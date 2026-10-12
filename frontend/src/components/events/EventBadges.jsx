import { Badge } from '../ui/index.js';

// Borde lateral de la tarjeta según la categoría (mismos colores que Badge)
export const CATEGORY_BORDERS = {
  sport: 'border-l-accent',
  culture: 'border-l-culture',
  recreation: 'border-l-success',
  other: 'border-l-ink-faint',
};

export function CategoryChip({ category }) {
  return <Badge category={category} />;
}

// Estados propios del evento: borrador, cancelado, en curso, finalizado, pasado y lleno
export function StatusBadges({ event }) {
  const statuses = [];
  if (event.status === 'draft') statuses.push('draft');
  if (event.status === 'cancelled') statuses.push('cancelled');
  if (event.status === 'in_progress') statuses.push('in_progress');
  if (event.status === 'finished') statuses.push('finished');
  const active = event.status === 'published' || event.status === 'in_progress';
  if (event.isPast && event.status === 'published') statuses.push('past');
  if (event.isFull && active && !event.isPast) statuses.push('full');

  return statuses.map((status) => <Badge key={status} status={status} />);
}
