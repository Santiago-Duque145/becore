import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';
import { CATEGORY_LABELS } from '../../lib/format.js';

// Fondos tintados del mismo color que el texto (skill §1). Siempre con texto: nunca solo color.
const TONES = {
  accent: 'bg-accent/15 text-accent-soft',
  culture: 'bg-culture/15 text-culture',
  success: 'bg-success/15 text-success',
  action: 'bg-action/15 text-action',
  danger: 'bg-danger/15 text-danger',
  neutral: 'bg-ink-muted/15 text-ink-muted',
};

// Categorías: sport → turquesa, culture → amarillo, recreation → verde, other → gris (skill §1)
export const CATEGORY_TONES = { sport: 'accent', culture: 'culture', recreation: 'success', other: 'neutral' };

// Estados del evento (ui.md §3) y de cupo/asistencia
export const STATUS_BADGES = {
  draft: ['Borrador', 'neutral'],
  published: ['Publicado', 'accent'],
  in_progress: ['En curso', 'success'],
  finished: ['Finalizado', 'neutral'],
  cancelled: ['Cancelado', 'action'],
  past: ['Pasado', 'neutral'],
  full: ['Lleno', 'neutral'],
  almost_full: ['Casi lleno', 'culture'],
  confirmed: ['Confirmado', 'success'],
};

// <Badge category="sport" /> · <Badge status="cancelled" /> · <Badge tone="accent">Texto</Badge>
export const Badge = forwardRef(function Badge(
  { category, status, tone, icon: Icon, className, children, ...props },
  ref,
) {
  let label = children;
  let resolvedTone = tone ?? 'neutral';
  if (category) {
    label ??= CATEGORY_LABELS[category];
    resolvedTone = tone ?? CATEGORY_TONES[category];
  } else if (status) {
    label ??= STATUS_BADGES[status][0];
    resolvedTone = tone ?? STATUS_BADGES[status][1];
  }
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] leading-none font-bold whitespace-nowrap',
        TONES[resolvedTone],
        className,
      )}
      {...props}
    >
      {Icon && <Icon size={12} />}
      {label}
    </span>
  );
});
