import { describe, expect, it } from 'vitest';
import { shouldSignOut } from './session-errors.js';

describe('shouldSignOut', () => {
  it('401 UNAUTHENTICATED (token inválido o vencido) → cierra sesión', () => {
    expect(shouldSignOut(401, 'UNAUTHENTICATED')).toBe(true);
  });

  it.each([
    ['otro 401', 401, 'SOMETHING_ELSE'],
    ['401 sin código (proxy, respuesta rara)', 401, undefined],
    ['500 del servidor', 500, 'INTERNAL_ERROR'],
    ['403 sin permiso', 403, 'FORBIDDEN'],
    ['sin respuesta (red caída)', undefined, 'NETWORK_ERROR'],
  ])('%s → no cierra sesión', (_name, status, code) => {
    expect(shouldSignOut(status, code)).toBe(false);
  });
});
