import { useRef } from 'react';
import { StarIcon } from '../icons/index.js';
import { cn } from '../../lib/cn.js';
import { STAR_LABELS } from '../../constants/ratings.js';

// Selector de 1 a 5 estrellas como radiogroup: las flechas mueven y eligen, Tab entra una sola vez.
export function StarRating({ value, onChange, 'aria-labelledby': labelledBy, className }) {
  const refs = useRef([]);

  function move(next) {
    const stars = Math.min(5, Math.max(1, next));
    onChange(stars);
    refs.current[stars - 1]?.focus();
  }

  function handleKeyDown(event, stars) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') move(stars + 1);
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') move(stars - 1);
    else return;
    event.preventDefault();
  }

  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className={cn('flex justify-center gap-1', className)}>
      {STAR_LABELS.map((label, index) => {
        const stars = index + 1;
        const checked = value === stars;
        return (
          <button
            key={stars}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={`${stars} ${stars === 1 ? 'estrella' : 'estrellas'}, ${label}`}
            tabIndex={checked || (!value && stars === 1) ? 0 : -1}
            onClick={() => onChange(stars)}
            onKeyDown={(event) => handleKeyDown(event, stars)}
            className="focus-ring flex h-12 w-12 items-center justify-center rounded-full transition-transform active:scale-90 motion-reduce:transition-none"
          >
            <StarIcon
              size={36}
              fill={value >= stars ? 'currentColor' : 'none'}
              className={value >= stars ? 'text-culture' : 'text-ink-faint'}
            />
          </button>
        );
      })}
    </div>
  );
}
