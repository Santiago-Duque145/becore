import { usePublicStats } from '../../hooks/usePublicStats.js';
import { publicStatsText } from '../../lib/public-stats.js';

// Dato en vivo bajo el tagline (P1): "12 eventos esta semana · 48 personas confirmadas".
// Va en posición absoluta para no mover el logo ni el tagline del mockup. Si falla o hay un 0, no se muestra.
export function LiveStats() {
  const { data } = usePublicStats();
  const text = publicStatsText(data);
  if (!text) return null;
  return (
    <p className="absolute top-full left-1/2 mt-3 flex -translate-x-1/2 animate-enter items-center gap-2 rounded-full border border-accent/20 bg-accent/[0.08] px-3 py-1 text-[11.5px] leading-[normal] font-semibold whitespace-nowrap text-accent-soft motion-reduce:animate-none">
      <span className="h-1.5 w-1.5 shrink-0 animate-blink rounded-full bg-accent motion-reduce:animate-none" aria-hidden="true" />
      {text}
    </p>
  );
}
