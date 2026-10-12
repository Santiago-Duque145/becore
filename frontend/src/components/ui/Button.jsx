import { forwardRef } from 'react';
import { Link } from 'react-router';
import { cn } from '../../lib/cn.js';
import { LoaderIcon } from '../icons/index.js';

const VARIANTS = {
  primary: 'bg-accent text-on-accent font-bold hover:brightness-110',
  secondary: 'bg-field border border-line text-ink font-semibold hover:border-ink-faint',
  ghost: 'text-accent font-semibold hover:bg-accent/10 hover:text-accent-soft',
  danger: 'border border-danger/40 text-danger font-semibold hover:bg-danger/10',
};

// md: botón de pantalla (≥ 48 px; 49 px como en los mockups con leading 17 px). sm: acción dentro de una tarjeta (≥ 44 px de área táctil).
const SIZES = {
  md: 'min-h-12 rounded-field px-5 py-4 text-[14.5px] leading-[17px]',
  sm: 'min-h-11 rounded-lg px-3.5 py-2 text-xs',
};

function buttonClass({ variant, size, className }) {
  return cn(
    'focus-ring inline-flex items-center justify-center gap-2 text-center transition duration-200 ease-out-soft',
    'active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 aria-disabled:pointer-events-none aria-disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, type = 'button', className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass({ variant, size, className })}
      {...props}
    >
      {loading && <LoaderIcon size={18} className="animate-spin motion-reduce:animate-none" />}
      {children}
    </button>
  );
});

export const LinkButton = forwardRef(function LinkButton(
  { variant = 'primary', size = 'md', className, ...props },
  ref,
) {
  return <Link ref={ref} className={buttonClass({ variant, size, className })} {...props} />;
});
