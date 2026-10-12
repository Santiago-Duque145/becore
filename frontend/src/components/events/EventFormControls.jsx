import { useId } from 'react';
import {
  MinusIcon,
  MusicIcon,
  PlusIcon,
  SparklesIcon,
  TreeIcon,
  TrophyIcon,
} from '../icons/index.js';
import { OptionCard } from '../ui/index.js';
import { cn } from '../../lib/cn.js';
import { CATEGORY_LABELS } from '../../lib/format.js';

const CATEGORY_ICONS = {
  sport: TrophyIcon,
  culture: MusicIcon,
  recreation: TreeIcon,
  other: SparklesIcon,
};
const CATEGORY_HINTS = {
  sport: 'Partidos, torneos, carreras',
  culture: 'Música, teatro, cine',
  recreation: 'Juegos, caminatas, planes',
  other: 'Ferias, talleres y más',
};

// Categoría con OptionCards con ícono (2 × 2). onBlur avisa al formulario al salir del grupo.
export function CategoryPicker({ value, onChange, onBlur, error }) {
  const labelId = useId();
  const errorId = useId();
  return (
    <div className="mb-4">
      <p id={labelId} className="mb-[7px] text-xs leading-[normal] font-semibold text-ink-muted">
        Categoría
      </p>
      <div
        role="group"
        aria-labelledby={labelId}
        aria-describedby={error ? errorId : undefined}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && onBlur()}
        className="grid grid-cols-2 gap-2.5"
      >
        {Object.keys(CATEGORY_LABELS).map((category) => (
          <OptionCard
            key={category}
            icon={CATEGORY_ICONS[category]}
            title={CATEGORY_LABELS[category]}
            description={CATEGORY_HINTS[category]}
            selected={value === category}
            onClick={() => onChange(category)}
          />
        ))}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

const stepButton =
  'focus-ring flex h-[47px] w-12 shrink-0 items-center justify-center rounded-field border border-line bg-field text-ink transition-colors hover:border-ink-faint disabled:cursor-not-allowed disabled:opacity-40';

// Cupo con botones − / + y el número editable. El input conserva las flechas del teclado.
export function CapacityStepper({ id, value, onChange, onBlur, min, max, invalid, describedBy }) {
  const number = Number(value) || 0;
  const set = (next) => onChange(String(Math.min(max, Math.max(min, next))));
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={stepButton}
        onClick={() => set(number - 1)}
        disabled={number <= min}
        aria-label="Restar un cupo"
      >
        <MinusIcon size={18} />
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={cn(
          'h-[47px] w-full min-w-0 rounded-field border bg-field px-4 text-center text-base leading-[17px] font-semibold text-ink tabular-nums outline-none focus:ring-2 md:text-sm',
          invalid
            ? 'border-danger focus:ring-danger/30'
            : 'border-line focus:border-accent focus:ring-accent/30',
        )}
      />
      <button
        type="button"
        className={stepButton}
        onClick={() => set(number + 1)}
        disabled={number >= max}
        aria-label="Sumar un cupo"
      >
        <PlusIcon size={18} />
      </button>
    </div>
  );
}
