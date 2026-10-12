import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';

// Píldora seleccionable (skill §3). Por defecto es un toggle con aria-pressed;
// con role="tab" usa aria-selected (pestañas tipo Próximos / Pasados).
// El ::after amplía el área táctil a 44 px sin cambiar el tamaño visual del mockup.
export const Chip = forwardRef(function Chip(
  { selected = false, icon: Icon, role, className, children, type = 'button', ...props },
  ref,
) {
  const stateProps = role === 'tab' ? { role, 'aria-selected': selected } : { 'aria-pressed': selected };
  return (
    <button
      ref={ref}
      type={type}
      {...stateProps}
      className={cn(
        "focus-ring relative inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold whitespace-nowrap transition duration-200 ease-out-soft after:absolute after:-inset-y-1.5 after:inset-x-0 after:content-['']",
        'disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
        selected
          ? 'border-accent bg-accent text-on-accent'
          : 'border-line text-ink-muted hover:border-ink-faint hover:text-ink',
        className,
      )}
      {...props}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
});
