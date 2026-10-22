import { CheckIcon, SparklesIcon } from '../icons/index.js';
import { cn } from '../../lib/cn.js';

// P8 · Razón de "Para ti" como insignia destacada arriba del título. kind (reasonKind de la API) solo cambia el ícono:
// destello (spark) o check. El texto nunca dice "IA" ni el nombre de la variante de la prueba A/B.
export function ReasonBadge({ reason, kind = 'check', className }) {
  const Icon = kind === 'spark' ? SparklesIcon : CheckIcon;
  return (
    <p
      className={cn(
        'reason-badge inline-flex max-w-full items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-[11.5px] leading-tight font-bold text-accent-soft',
        'origin-left animate-badge-in motion-reduce:animate-none',
        className,
      )}
    >
      <Icon size={12} className="shrink-0" />
      <span className="min-w-0">{reason}</span>
    </p>
  );
}
