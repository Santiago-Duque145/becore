import { LOADER_DELAY_MS, LOADER_MIN_VISIBLE_MS } from '../constants/loading.js';

// Qué debe hacer el loader de pantalla completa según si la carga sigue activa y si ya se ve:
// - activa y oculto → mostrarlo dentro de LOADER_DELAY_MS (si la carga termina antes, nunca aparece);
// - terminada y visible → ocultarlo cuando haya cumplido LOADER_MIN_VISIBLE_MS en pantalla;
// - en otro caso, nada. Devuelve { action: 'show' | 'hide' | 'none', in: ms }.
export function planLoader({ active, visible, shownAt = 0, now = 0, delay = LOADER_DELAY_MS, minVisible = LOADER_MIN_VISIBLE_MS }) {
  if (active && !visible) return { action: 'show', in: delay };
  if (!active && visible) return { action: 'hide', in: Math.max(0, minVisible - (now - shownAt)) };
  return { action: 'none', in: 0 };
}

// Siguiente frase en bucle
export const nextPhrase = (index, total) => (total > 0 ? (index + 1) % total : 0);
