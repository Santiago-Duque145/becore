import { describe, expect, it } from 'vitest';
import { consentMode } from './consent-flow.js';

const pending = { onboardingCompleted: false, dataConsentAccepted: false };
const oldAccount = { onboardingCompleted: true, dataConsentAccepted: false };

describe('consentMode', () => {
  it('usuario nuevo por Google (onboarding pendiente, sin marca del registro) → primer paso de /bienvenida', () => {
    expect(consentMode(pending, false)).toBe('step');
  });

  it('usuario nuevo por correo (marcó la casilla en /registro) → se guarda solo, sin pedirlo otra vez', () => {
    expect(consentMode(pending, true)).toBe('auto');
  });

  it('cuenta vieja (onboarding completo, sin consentimiento) → diálogo modal', () => {
    expect(consentMode(oldAccount, false)).toBe('dialog');
  });

  it('con onboarding pendiente nunca se ve el diálogo', () => {
    expect(consentMode(pending, false)).not.toBe('dialog');
    expect(consentMode(pending, true)).not.toBe('dialog');
  });

  it('la marca del registro no afecta a una cuenta vieja', () => {
    expect(consentMode(oldAccount, true)).toBe('dialog');
  });

  it('ya aceptó o sin perfil → nada', () => {
    expect(consentMode({ onboardingCompleted: true, dataConsentAccepted: true }, false)).toBe('none');
    expect(consentMode({ onboardingCompleted: false, dataConsentAccepted: true }, false)).toBe('none');
    expect(consentMode(null, false)).toBe('none');
  });
});
