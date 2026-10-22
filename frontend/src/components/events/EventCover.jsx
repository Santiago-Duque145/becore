import { useState } from 'react';
import { cn } from '../../lib/cn.js';
import { CATEGORY_LABELS } from '../../lib/format.js';
import { MusicIcon, SparklesIcon, TreeIcon, TrophyIcon } from '../icons/index.js';
import { CategoryGlyph } from '../ui/index.js';

// Cabecera de la tarjeta (mobile-descubre / desktop-descubre): degradado e ícono por categoría,
// píldora de categoría a la izquierda y de cupo a la derecha. Sin fotos externas.
const COVERS = {
  sport: { bg: 'bg-cover-sport', text: 'text-accent-soft', Icon: TrophyIcon },
  culture: { bg: 'bg-cover-culture', text: 'text-culture', Icon: MusicIcon },
  recreation: { bg: 'bg-cover-recreation', text: 'text-success', Icon: TreeIcon },
  other: { bg: 'bg-cover-other', text: 'text-ink-muted', Icon: SparklesIcon },
};

const pill = 'absolute top-2.5 rounded-full bg-bg/65 px-[9px] py-1 text-[11px] leading-none font-bold backdrop-blur-[2px]';

export function EventCover({ event, className }) {
  const cover = COVERS[event.category] ?? COVERS.other;
  // Mientras baja la portada subida, el ícono animado de la categoría (P7); la foto entra con un fundido
  const [loadedUrl, setLoadedUrl] = useState(null);
  const loading = Boolean(event.coverUrl) && loadedUrl !== event.coverUrl;
  return (
    <div className={cn('relative h-[84px] shrink-0 overflow-hidden md:h-[108px]', cover.bg, className)}>
      {event.coverUrl ? (
        <>
          {loading && (
            <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <CategoryGlyph category={event.category} px={28} />
            </span>
          )}
          <img
            src={event.coverUrl}
            alt=""
            loading="lazy"
            onLoad={() => setLoadedUrl(event.coverUrl)}
            onError={() => setLoadedUrl(event.coverUrl)}
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-opacity duration-200 motion-reduce:transition-none',
              loading ? 'opacity-0' : 'opacity-100',
            )}
          />
        </>
      ) : (
        <cover.Icon
          size={36}
          className={cn('absolute right-3 bottom-2.5 opacity-40 md:size-11', cover.text)}
          strokeWidth={1.5}
        />
      )}
      <span className={cn(pill, 'left-2.5', cover.text)}>{CATEGORY_LABELS[event.category]}</span>
      <span className={cn(pill, 'right-2.5 text-ink tabular-nums')} aria-hidden="true">
        {event.confirmedCount}/{event.capacity}
      </span>
    </div>
  );
}
