import { useEffect, useState } from 'react';
import { useActivityStream } from '../../hooks/useActivityFeed.js';
import { cn } from '../../lib/cn.js';
import { formatRelative } from '../../lib/format.js';

const ACTIONS = {
  confirmed: { text: 'confirmó su asistencia a', dot: 'bg-accent' },
  cancelled: { text: 'canceló su asistencia a', dot: 'bg-action' },
  checked_in: { text: 'llegó a', dot: 'bg-success' },
};

// "Actividad en vivo" del panel: Realtime de activity_log filtrado a los eventos del organizador.
// Empieza vacío (no hay endpoint de actividad global) y se llena con lo que pase con el panel abierto.
export function LiveActivityPanel({ events }) {
  const titles = new Map(events.map((e) => [e.id, e.title]));
  const items = useActivityStream({ eventIds: events.map((e) => e.id), max: 6 });
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!items.length) return undefined;
    const timer = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(timer);
  }, [items.length]);

  return (
    <section aria-labelledby="actividad-en-vivo" className="rounded-card border border-white/[0.06] bg-panel px-[18px] py-4">
      <h2 id="actividad-en-vivo" className="mb-3.5 flex items-center gap-[7px] font-display text-[13.5px] font-semibold text-ink">
        <span className="h-[7px] w-[7px] animate-blink rounded-full bg-accent motion-reduce:animate-none" aria-hidden="true" />
        Actividad en vivo
      </h2>
      {items.length === 0 ? (
        <p className="text-xs text-ink-muted">Aquí verás quién confirma, cancela o llega a tus eventos mientras tengas el panel abierto.</p>
      ) : (
        <ul aria-live="polite">
          {items.map((item) => {
            const action = ACTIONS[item.action] ?? ACTIONS.confirmed;
            return (
              <li key={item.id} className="flex animate-enter gap-2.5 border-t border-white/5 py-[9px] first:border-t-0 first:pt-0 motion-reduce:animate-none">
                <span className={cn('mt-[5px] h-2 w-2 shrink-0 rounded-full', action.dot)} aria-hidden="true" />
                <div>
                  <p className="text-xs leading-[1.4] text-ink/80">
                    <b className="font-semibold text-ink">{item.actorName}</b> {action.text}{' '}
                    {titles.get(item.eventId) ?? item.eventTitle ?? 'tu evento'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">{formatRelative(item.createdAt)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
