// Foco atrapado en un diálogo modal: Tab y Shift+Tab dan la vuelta dentro del panel.
export const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// A qué elemento va el foco al pulsar Tab. `current` es el índice del enfocado dentro de la lista
// (-1 si el foco está en el propio panel). Devuelve -1 si no hay nada enfocable.
export function nextTabIndex(count, current, backwards) {
  if (count === 0) return -1;
  if (backwards) return current <= 0 ? count - 1 : current - 1;
  return current < 0 || current >= count - 1 ? 0 : current + 1;
}
