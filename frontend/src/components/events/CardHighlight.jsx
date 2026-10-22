import { ClockIcon, StarIcon, UsersIcon } from '../icons/index.js';
import { Badge } from '../ui/index.js';
import { cardHighlight } from '../../lib/card-highlight.js';
import { cn } from '../../lib/cn.js';

const ICONS = { today: ClockIcon, tomorrow: ClockIcon, few_spots: UsersIcon, filling: UsersIcon, new: StarIcon };

// P8 · Un mensaje de estado por tarjeta (lib/card-highlight.js): naranja para lo urgente, amarillo para "Nuevo".
// Siempre texto + ícono: el color nunca va solo.
export function CardHighlight({ event, mine = false, className }) {
  const highlight = cardHighlight(event, { mine });
  if (!highlight) return null;
  return (
    <Badge
      tone={highlight.tone}
      icon={ICONS[highlight.kind]}
      className={cn('origin-left animate-badge-in motion-reduce:animate-none', className)}
    >
      {highlight.label}
    </Badge>
  );
}
