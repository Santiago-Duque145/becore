import { forwardRef, useId } from 'react';
import { cn } from '../../lib/cn.js';

// Isotipo de los mockups (cuadro azul profundo + "B" con degradado turquesa→blanco) y wordmark "Be Core".
// size 28 (barras) o 52 (hero del login). stacked pone el wordmark debajo, como en mobile-login.
export const BrandMark = forwardRef(function BrandMark(
  { size = 28, wordmark = true, stacked = false, className, ...props },
  ref,
) {
  const gradientId = useId();
  const large = size >= 40;
  return (
    <div
      ref={ref}
      className={cn('inline-flex items-center', stacked ? 'flex-col gap-3.5' : 'gap-2.5', className)}
      {...props}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 34 34"
        fill="none"
        aria-hidden={wordmark || undefined}
        role={wordmark ? undefined : 'img'}
        aria-label={wordmark ? undefined : 'Be Core'}
      >
        <rect width="34" height="34" rx="9" fill="var(--color-bg-deep)" />
        <path
          d="M10 24 L10 10 Q10 8 12 8 L18 8 Q23 8 23 12.5 Q23 16 19 17 Q24 18 24 22.5 Q24 27 18 27 L12 27 Q10 27 10 25 Z"
          fill={`url(#${gradientId})`}
        />
        <defs>
          <linearGradient id={gradientId} x1="10" y1="8" x2="24" y2="27" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--color-accent)" />
            <stop offset="1" stopColor="white" />
          </linearGradient>
        </defs>
      </svg>
      {wordmark && (
        <span className={cn('font-display font-bold text-white', large ? 'text-2xl' : 'text-lg')}>
          Be <span className="text-accent">Core</span>
        </span>
      )}
    </div>
  );
});
