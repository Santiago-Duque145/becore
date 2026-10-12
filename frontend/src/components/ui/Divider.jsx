import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';

// Línea – texto – línea, como "o continúa con" del login (skill §3)
export const Divider = forwardRef(function Divider({ children, className, ...props }, ref) {
  return (
    <div
      ref={ref}
      role="separator"
      className={cn(
        'flex items-center gap-3 text-[11.5px] leading-[normal] text-ink-faint before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
