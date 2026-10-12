import { forwardRef } from 'react';

// Íconos SVG inline: trazo 2 px, 24×24, currentColor (skill becore-ui §6).
// Son decorativos por defecto (aria-hidden); si llevan aria-label pasan a ser imagen accesible.
export function createIcon(displayName, nodes) {
  const Icon = forwardRef(function Icon({ size = 20, className = '', ...props }, ref) {
    const labelled = Boolean(props['aria-label']);
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden={labelled ? undefined : true}
        role={labelled ? 'img' : undefined}
        focusable="false"
        {...props}
      >
        {nodes.map(([Tag, attrs], i) => (
          <Tag key={i} {...attrs} />
        ))}
      </svg>
    );
  });
  Icon.displayName = displayName;
  return Icon;
}
