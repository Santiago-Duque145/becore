import { useEffect, useState } from 'react';
import { useActivityFeed } from '../../hooks/useActivityFeed.js';
import { formatRelative } from '../../lib/format.js';

const ACTIONS = {
  confirmed: 'confirmó su asistencia a',
  cancelled: 'canceló su asistencia a',
  checked_in: 'llegó a',
};

function activityText(activity) {
  const target = activity.eventTitle ? `«${activity.eventTitle}»` : 'un evento';
  return `${activity.actorName} ${ACTIONS[activity.action] ?? 'se movió en'} ${target}`;
}

// Píldora "en vivo" de mobile-descubre. Hasta que llega la primera actividad muestra un texto de espera.
export function LiveTicker() {
  const latest = useActivityFeed();
  const [, setTick] = useState(0);

  // Refresca el "hace x min" cada 30 s
  useEffect(() => {
    if (!latest) return undefined;
    const timer = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(timer);
  }, [latest]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-w-0 items-center gap-2 rounded-full border border-accent/20 bg-accent/[0.08] px-3.5 py-2 text-[11.5px] font-semibold text-accent-soft"
    >
      <span className="h-1.5 w-1.5 shrink-0 animate-blink rounded-full bg-accent motion-reduce:animate-none" aria-hidden="true" />
      <span className="sr-only">En vivo:</span>
      <span key={latest?.id} className="min-w-0 truncate animate-enter motion-reduce:animate-none">
        {latest ? `${activityText(latest)} ${formatRelative(latest.createdAt)}` : 'Aquí verás en vivo quién se apunta a los eventos'}
      </span>
    </div>
  );
}
