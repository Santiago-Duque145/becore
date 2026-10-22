import { createHash } from 'node:crypto';

// Prueba A/B (docs/specs/ai.md §10): variante determinista por usuario. La misma persona siempre ve la misma variante.
// sha256(user_id + AB_SALT): primer byte par → "rules" (R5 tal cual), impar → "ai" (híbrido + re-ordenado con Gemini).
// Se calcula en el servidor; ni el id ni el hash se envían a Gemini.
export function abVariant(userId, salt) {
  const firstByte = createHash('sha256').update(`${userId}${salt}`).digest()[0];
  return firstByte % 2 === 0 ? 'rules' : 'ai';
}
