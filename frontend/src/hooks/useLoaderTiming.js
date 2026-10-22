import { useEffect, useRef, useState } from 'react';
import { LOADER_SLOW_MS, PHRASE_INTERVAL_MS } from '../constants/loading.js';
import { nextPhrase, planLoader } from '../lib/loader-timing.js';

// ¿Se ve el loader de pantalla completa? Aparece si la carga pasa de 300 ms y, una vez visible, dura mínimo 500 ms.
// Uso: const visible = useLoaderVisibility(loading); mientras (loading || visible) la pantalla muestra el loader
// (o un fondo vacío si aún no es visible), así no hay parpadeos ni con cargas cortas ni al terminar.
export function useLoaderVisibility(active) {
  const [visible, setVisible] = useState(false);
  const shownAt = useRef(0);

  useEffect(() => {
    const plan = planLoader({ active, visible, shownAt: shownAt.current, now: Date.now() });
    if (plan.action === 'none') return undefined;
    const timer = setTimeout(() => {
      if (plan.action === 'show') shownAt.current = Date.now();
      setVisible(plan.action === 'show');
    }, plan.in);
    return () => clearTimeout(timer);
  }, [active, visible]);

  return visible;
}

// true después de `ms` desde que se monta (estado "tardando más de lo normal"). ms = null: nunca.
export function useElapsed(ms = LOADER_SLOW_MS) {
  const [elapsed, setElapsed] = useState(ms != null && ms <= 0);
  useEffect(() => {
    if (ms == null || ms <= 0) return undefined;
    const timer = setTimeout(() => setElapsed(true), ms);
    return () => clearTimeout(timer);
  }, [ms]);
  return elapsed;
}

// Índice de la frase actual; cambia cada 1,8 s mientras `enabled`. Empieza en una frase al azar.
export function usePhraseIndex(total, enabled = true) {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * Math.max(total, 1)));
  useEffect(() => {
    if (!enabled || total < 2) return undefined;
    const timer = setInterval(() => setIndex((i) => nextPhrase(i, total)), PHRASE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [enabled, total]);
  return index;
}
