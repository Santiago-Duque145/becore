// P8 · Geometría del editor de encuadre (funciones puras, sin DOM).
// Estado: { iw, ih } tamaño real de la imagen · { fw, fh } tamaño del marco en px de pantalla · zoom ≥ 1 (1 = la
// imagen justo cubre el marco) · { x, y } desplazamiento del centro de la imagen respecto al centro del marco, en px
// de pantalla. La imagen siempre cubre el marco: nunca quedan huecos.

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
export const ZOOM_STEP = 0.1; // +/− y cada paso de la rueda
export const KEY_STEP = 10; // flechas (Shift: ×4)

// Escala (px de pantalla por px de imagen) con la que la imagen cubre el marco a zoom 1
export const baseScale = ({ iw, ih, fw, fh }) => Math.max(fw / iw, fh / ih);
export const scaleOf = (state) => baseScale(state) * state.zoom;

const clampNumber = (value, min, max) => Math.min(max, Math.max(min, value));

// Corrige zoom y desplazamiento para que la imagen cubra el marco
export function clampState(state) {
  const zoom = clampNumber(state.zoom, MIN_ZOOM, MAX_ZOOM);
  const scale = baseScale(state) * zoom;
  const maxX = Math.max(0, (state.iw * scale - state.fw) / 2);
  const maxY = Math.max(0, (state.ih * scale - state.fh) / 2);
  return { ...state, zoom, x: clampNumber(state.x, -maxX, maxX) || 0, y: clampNumber(state.y, -maxY, maxY) || 0 };
}

// Estado inicial: centrado y sin zoom
export const initialState = (image, frame) => clampState({ ...image, ...frame, zoom: 1, x: 0, y: 0 });
export const centered = (state) => clampState({ ...state, zoom: 1, x: 0, y: 0 });

// El marco cambió de tamaño (rotar el celular, abrir en otra pantalla): se conserva lo mismo en el centro
export function resizeFrame(state, frame) {
  const ratio = frame.fw / state.fw;
  return clampState({ ...state, ...frame, x: state.x * ratio, y: state.y * ratio });
}

export const moveBy = (state, dx, dy) => clampState({ ...state, x: state.x + dx, y: state.y + dy });

// Zoom manteniendo fijo el punto (px, py) del marco, medido desde su centro (cursor, centro del pellizco o 0,0)
export function zoomTo(state, zoom, px = 0, py = 0) {
  const next = clampNumber(zoom, MIN_ZOOM, MAX_ZOOM);
  const ratio = next / state.zoom;
  return clampState({ ...state, zoom: next, x: px - (px - state.x) * ratio, y: py - (py - state.y) * ratio });
}

// Rectángulo de la imagen original que queda dentro del marco, en px reales
export function cropRect(state) {
  const scale = scaleOf(state);
  const width = state.fw / scale;
  const height = state.fh / scale;
  const left = state.iw / 2 - state.x / scale - width / 2;
  const top = state.ih / 2 - state.y / scale - height / 2;
  return { x: Math.max(0, left), y: Math.max(0, top), width: Math.min(width, state.iw), height: Math.min(height, state.ih) };
}

// Teclado del marco → estado nuevo, o null si la tecla no es del editor
export function keyAction(state, key, shiftKey = false) {
  const step = KEY_STEP * (shiftKey ? 4 : 1);
  switch (key) {
    case 'ArrowLeft':
      return moveBy(state, -step, 0);
    case 'ArrowRight':
      return moveBy(state, step, 0);
    case 'ArrowUp':
      return moveBy(state, 0, -step);
    case 'ArrowDown':
      return moveBy(state, 0, step);
    case '+':
    case '=':
      return zoomTo(state, state.zoom + ZOOM_STEP);
    case '-':
    case '_':
      return zoomTo(state, state.zoom - ZOOM_STEP);
    case '0':
      return centered(state);
    default:
      return null;
  }
}
