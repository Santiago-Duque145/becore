import { forwardRef, useState } from 'react';
import { cn } from '../../lib/cn.js';

// Píldora seleccionable (skill §3). Por defecto es un toggle con aria-pressed;
// con role="tab" usa aria-selected (pestañas tipo Próximos / Pasados).
// El ::after amplía el área táctil a 44 px sin cambiar el tamaño visual del mockup.
// P1: al elegir un toggle (no al quitarlo ni en pestañas) da un rebote corto; se apaga con motion-reduce.
export const Chip = forwardRef(function Chip(
  { selected = false, icon: Icon, role, className, children, type = 'button', onClick, onAnimationEnd, ...props },
  ref,
) {
  const [popping, setPopping] = useState(false);
  const stateProps = role === 'tab' ? { role, 'aria-selected': selected } : { 'aria-pressed': selected };

  function handleClick(event) {
    if (!selected && role !== 'tab') setPopping(true);
    onClick?.(event);
  }

  function handleAnimationEnd(event) {
    setPopping(false);
    onAnimationEnd?.(event);
  }

  return (
    <button
      ref={ref}
      type={type}
      {...stateProps}
      onClick={handleClick}
      onAnimationEnd={handleAnimationEnd}
      className={cn(
        "focus-ring relative inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold whitespace-nowrap transition duration-200 ease-out-soft after:absolute after:-inset-y-1.5 after:inset-x-0 after:content-['']",
        'disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
        popping && 'animate-chip-pop motion-reduce:animate-none',
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
