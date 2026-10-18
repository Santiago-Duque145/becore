// Lógica pura del campo de código de verificación (6 dígitos), para poder probarla sin navegador.
export const OTP_LENGTH = 6;

export const digitsOnly = (text) => String(text ?? '').replace(/\D/g, '');

// Estado del campo: arreglo de 6 posiciones, cada una '' o un dígito
export const emptyDigits = () => Array.from({ length: OTP_LENGTH }, () => '');
export const toDigits = (code) => emptyDigits().map((_, i) => digitsOnly(code)[i] ?? '');
export const toCode = (digits) => digits.join('');
export const isComplete = (digits) => digits.every(Boolean);

// Escribir o pegar texto en una casilla: reparte los dígitos desde ahí. Pegar el código completo
// (6 dígitos o más, como hace el autocompletado del celular) siempre lo pone entero desde la primera casilla.
export function enterText(digits, index, text) {
  const clean = digitsOnly(text);
  if (!clean) return { digits, focus: index };
  const start = clean.length >= OTP_LENGTH ? 0 : index;
  const next = [...digits];
  let position = start;
  for (const char of clean) {
    if (position >= OTP_LENGTH) break;
    next[position] = char;
    position += 1;
  }
  return { digits: next, focus: Math.min(position, OTP_LENGTH - 1) };
}

// Retroceso: borra la casilla actual; si ya estaba vacía, retrocede y borra la anterior
export function backspaceAt(digits, index) {
  const next = [...digits];
  if (next[index]) {
    next[index] = '';
    return { digits: next, focus: index };
  }
  if (index > 0) {
    next[index - 1] = '';
    return { digits: next, focus: index - 1 };
  }
  return { digits: next, focus: 0 };
}

// Flechas izquierda y derecha mueven el foco sin salir del campo; otras teclas devuelven null
export function arrowTarget(key, index) {
  if (key === 'ArrowLeft') return Math.max(index - 1, 0);
  if (key === 'ArrowRight') return Math.min(index + 1, OTP_LENGTH - 1);
  return null;
}

// Cuenta regresiva del botón "Reenviar código"
export const RESEND_SECONDS = 60;
export const secondsLeft = (endAt, now = Date.now()) => Math.max(Math.ceil((endAt - now) / 1000), 0);
