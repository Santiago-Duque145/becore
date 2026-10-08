import { describe, it, expect } from 'vitest';
import { bogotaInputToIso, isoToBogotaInput } from './format.js';

describe('conversión de fechas de Bogotá', () => {
  it('datetime-local → ISO UTC (UTC-5)', () => {
    expect(bogotaInputToIso('2026-10-31T15:00')).toBe('2026-10-31T20:00:00.000Z');
  });

  it('cruza de día correctamente', () => {
    expect(bogotaInputToIso('2026-10-31T21:30')).toBe('2026-11-01T02:30:00.000Z');
  });

  it('ISO UTC → datetime-local de Bogotá', () => {
    expect(isoToBogotaInput('2026-11-01T02:30:00.000Z')).toBe('2026-10-31T21:30');
  });

  it('es reversible', () => {
    expect(isoToBogotaInput(bogotaInputToIso('2026-12-24T08:15'))).toBe('2026-12-24T08:15');
  });
});
