import { useNavigate } from 'react-router';
import { cn } from '../../lib/cn.js';
import { CATEGORY_LABELS } from '../../lib/format.js';
import { ChevronLeftIcon } from '../icons/index.js';
import { BrandLoader, Skeleton } from '../ui/index.js';
import { StatusBadges } from './EventBadges.jsx';

// Piezas del detalle de evento (mobile-detalle-evento.html)

const COVER_BG = {
  sport: 'bg-cover-sport',
  culture: 'bg-cover-culture',
  recreation: 'bg-cover-recreation',
  other: 'bg-cover-other',
};
const PILL_TEXT = {
  sport: 'text-accent-soft',
  culture: 'text-culture',
  recreation: 'text-success',
  other: 'text-ink-muted',
};

// Portada por categoría con botón atrás arriba y la categoría abajo (230 px en móvil)
export function DetailCover({ event }) {
  const navigate = useNavigate();
  // Si se llegó desde la app, vuelve a donde estaba; si se abrió el enlace directo, va a Descubre
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/descubre'));
  return (
    <div
      className={cn(
        'relative flex h-[230px] shrink-0 flex-col justify-between overflow-hidden px-5 pt-[max(20px,env(safe-area-inset-top))] pb-5 md:h-[200px] md:rounded-card',
        COVER_BG[event.category] ?? COVER_BG.other,
      )}
    >
      {event.coverUrl && (
        <>
          <img src={event.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <span className="absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-bg/40" aria-hidden="true" />
        </>
      )}
      <button
        type="button"
        onClick={goBack}
        aria-label="Volver"
        className="focus-ring relative z-10 flex h-9 w-9 items-center justify-center rounded-[10px] bg-bg/55 text-ink after:absolute after:-inset-1 after:content-['']"
      >
        <ChevronLeftIcon size={16} />
      </button>
      <div className="relative z-10 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'rounded-full bg-bg/55 px-3 py-[5px] text-[11px] leading-none font-bold',
            PILL_TEXT[event.category] ?? PILL_TEXT.other,
          )}
        >
          {CATEGORY_LABELS[event.category]}
        </span>
        <StatusBadges event={event} />
      </div>
    </div>
  );
}

// Fila de información: ícono en cuadro de 34 px + texto principal y secundario
export function InfoRow({ icon: Icon, main, sub }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-field text-accent-soft">
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-ink">{main}</p>
        {sub && <p className="mt-px text-[11.5px] text-ink-muted">{sub}</p>}
      </div>
    </div>
  );
}

// Carga del detalle. Si se llega desde una tarjeta ya se sabe la categoría: la portada toma su degradado y el ícono
// animado de la categoría (P7: balón que rebota, nota que vibra…); si no, bloque con el barrido de marca.
export function DetailSkeleton({ category }) {
  const coverBg = COVER_BG[category];
  return (
    <div className="mx-auto w-full max-w-[720px]" aria-busy="true" aria-label="Cargando evento">
      {coverBg ? (
        <div className={cn('flex h-[230px] items-center justify-center md:h-[200px] md:rounded-card', coverBg)}>
          <BrandLoader category={category} size="md" phrases={false} label="Cargando evento" />
        </div>
      ) : (
        <div className="skeleton-sweep h-[230px] bg-field md:h-[200px] md:rounded-card" />
      )}
      <div className="flex flex-col gap-3 px-[22px] pt-[22px] md:px-0">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-[34px] w-2/3" />
        <Skeleton className="h-[34px] w-1/2" />
        <Skeleton className="h-[62px] w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}
