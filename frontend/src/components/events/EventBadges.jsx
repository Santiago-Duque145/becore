import { CATEGORY_LABELS } from '../../lib/format.js';

const CATEGORY_STYLES = {
  sport: 'bg-teal-500 text-navy-900',
  culture: 'bg-yellow-400 text-navy-900',
  recreation: 'bg-emerald-500 text-navy-900',
  other: 'bg-gray-500 text-white',
};

export const CATEGORY_BORDERS = {
  sport: 'border-l-teal-500',
  culture: 'border-l-yellow-400',
  recreation: 'border-l-emerald-500',
  other: 'border-l-gray-500',
};

function Pill({ className, children }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>{children}</span>;
}

export function CategoryChip({ category }) {
  return <Pill className={CATEGORY_STYLES[category]}>{CATEGORY_LABELS[category]}</Pill>;
}

// Estados propios del evento: borrador, cancelado, en curso, finalizado, pasado y lleno
export function StatusBadges({ event }) {
  const badges = [];
  if (event.status === 'draft') badges.push(['Borrador', 'bg-gray-200 text-navy-900']);
  if (event.status === 'cancelled') badges.push(['Cancelado', 'bg-orange-500 text-white']);
  if (event.status === 'in_progress') badges.push(['En curso', 'bg-emerald-500 text-navy-900']);
  if (event.status === 'finished') badges.push(['Finalizado', 'bg-gray-500 text-white']);
  const active = event.status === 'published' || event.status === 'in_progress';
  if (event.isPast && event.status === 'published') badges.push(['Pasado', 'bg-gray-500 text-white']);
  if (event.isFull && active && !event.isPast) badges.push(['Lleno', 'bg-navy-800 text-white']);

  return badges.map(([label, style]) => (
    <Pill key={label} className={style}>
      {label}
    </Pill>
  ));
}
