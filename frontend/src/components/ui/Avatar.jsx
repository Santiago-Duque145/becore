import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';
import { PresetAvatarSvg } from '../../assets/avatars/index.jsx';

const SIZES = {
  sm: 'h-6 w-6 text-[11px]',
  md: 'h-[34px] w-[34px] text-xs',
  lg: 'h-[52px] w-[52px] text-base',
};

export function initials(name = '') {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

// Foto redonda, avatar predefinido de la marca (preset) o, si no hay, iniciales sobre bg-field. decorative=true cuando el nombre ya se lee al lado.
export const Avatar = forwardRef(function Avatar(
  { name = '', src, preset, size = 'md', decorative = false, className, ...props },
  ref,
) {
  const a11y = decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': name };
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-field font-semibold text-ink-muted',
        SIZES[size],
        className,
      )}
      {...a11y}
      {...props}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : preset ? (
        <PresetAvatarSvg id={preset} className="h-full w-full" />
      ) : (
        initials(name)
      )}
    </span>
  );
});
