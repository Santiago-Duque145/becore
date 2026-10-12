import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';
import { CheckIcon } from '../icons/index.js';

// Tarjeta seleccionable grande para onboarding o rol (skill §3). Es un <button aria-pressed>.
export const OptionCard = forwardRef(function OptionCard(
  { selected = false, icon: Icon, title, description, className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={selected}
      className={cn(
        'focus-ring flex w-full items-start gap-3 rounded-card border p-4 text-left transition duration-200 ease-out-soft',
        'disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
        selected ? 'border-accent bg-accent/10' : 'border-line bg-panel hover:border-ink-faint',
        className,
      )}
      {...props}
    >
      {Icon && (
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-field',
            selected ? 'bg-accent/15 text-accent-soft' : 'bg-field text-ink-muted',
          )}
        >
          <Icon size={20} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{title}</span>
        {description && <span className="mt-0.5 block text-xs text-ink-muted">{description}</span>}
      </span>
      <span
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition',
          selected ? 'border-accent bg-accent text-on-accent' : 'border-line',
        )}
      >
        {selected && <CheckIcon size={14} />}
      </span>
    </button>
  );
});
