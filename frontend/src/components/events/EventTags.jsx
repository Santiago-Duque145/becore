import { INTEREST_GROUPS } from '../../constants/preferences.js';
import { cn } from '../../lib/cn.js';

const INTEREST_LABELS = Object.fromEntries(INTEREST_GROUPS.flatMap((group) => group.options.map((o) => [o.slug, o.label])));

// Gustos del onboarding con los que Gemini etiquetó el evento (IA2). Solo los slugs conocidos, en español.
export const tagLabels = (tags) => (tags ?? []).map((slug) => INTEREST_LABELS[slug]).filter(Boolean);

// Chips de solo lectura (no se seleccionan): por eso no son <Chip>, que es un botón con aria-pressed
export function EventTags({ tags, className }) {
  const labels = tagLabels(tags);
  if (!labels.length) return null;
  return (
    <ul aria-label="Gustos de este evento" className={cn('flex flex-wrap gap-2', className)}>
      {labels.map((label) => (
        <li key={label} className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink-muted">
          {label}
        </li>
      ))}
    </ul>
  );
}
