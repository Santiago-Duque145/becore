import { describe, expect, it } from 'vitest';
import { registerSchema } from './auth-schemas.js';

const valid = { fullName: 'Ana Gómez', email: 'ana@correo.com', password: 'partido31', consent: true };

describe('registerSchema · consentimiento de datos', () => {
  it('con la política aceptada pasa', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('sin aceptar la política no pasa y el mensaje es claro', () => {
    const result = registerSchema.safeParse({ ...valid, consent: false });
    expect(result.success).toBe(false);
    expect(result.error.issues[0]).toMatchObject({
      path: ['consent'],
      message: 'Debes aceptar la política para crear tu cuenta',
    });
  });

  it('sin el campo tampoco pasa', () => {
    const { consent: _consent, ...withoutConsent } = valid;
    expect(registerSchema.safeParse(withoutConsent).success).toBe(false);
  });
});
