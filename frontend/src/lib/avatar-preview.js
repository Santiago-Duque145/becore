import { nextTabIndex } from './focus-trap.js';

// Lógica pura de la vista previa de avatar (para poder probarla sin navegador).

export const ROLE_LABELS = { organizer: 'Organizador', participant: 'Participante' };

// Deslizar hacia abajo más de esto (px) cierra la vista previa en móvil
export const SWIPE_CLOSE_PX = 90;
export const shouldCloseOnSwipe = (deltaY) => deltaY >= SWIPE_CLOSE_PX;

export function firstName(name = '') {
  return name.trim().split(/\s+/)[0] ?? '';
}

// Lo único que la vista previa puede mostrar: nombre de pila, rol y la imagen. Aunque quien llama pase un
// perfil completo (correo, apellidos, ids…), todo lo demás se descarta aquí.
export function toPreviewPerson({ name, role, src = null, preset = null, action = null } = {}) {
  return {
    firstName: firstName(name),
    roleLabel: ROLE_LABELS[role] ?? ROLE_LABELS.participant,
    src: src || null,
    preset: src ? null : preset || null,
    action: action ? { label: action.label, onClick: action.onClick } : null,
  };
}

// Qué hacer con una tecla dentro del diálogo: Escape cierra y Tab da la vuelta entre los enfocables
export function dialogKeyAction({ key, shiftKey = false, count, current }) {
  if (key === 'Escape') return { type: 'close' };
  if (key === 'Tab') return { type: 'focus', index: nextTabIndex(count, current, shiftKey) };
  return null;
}

// Al cerrar, el foco vuelve al avatar que abrió la vista previa (si sigue en pantalla)
export function restoreFocus(trigger) {
  if (!trigger?.isConnected || typeof trigger.focus !== 'function') return false;
  trigger.focus();
  return true;
}

// Zoom desde el avatar tocado (FLIP): traslación y escala que llevan la imagen grande hasta el avatar
export function zoomFrom(fromRect, toRect) {
  const scale = toRect.width > 0 ? fromRect.width / toRect.width : 1;
  return {
    scale,
    x: fromRect.left + fromRect.width / 2 - (toRect.left + toRect.width / 2),
    y: fromRect.top + fromRect.height / 2 - (toRect.top + toRect.height / 2),
  };
}
