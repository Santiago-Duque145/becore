import { describe, it, expect } from 'vitest';
import { parseEnv } from '../src/config/env.js';
import { abVariant } from '../src/services/recommendations/variant.js';

const base = { FRONTEND_URL: 'http://localhost:5173', SUPABASE_URL: 'http://localhost:54321', SUPABASE_SECRET_KEY: 'x' };

describe('AB_SALT', () => {
  it('con AI_ENABLED=true y sin AB_SALT el backend no arranca y dice que falta AB_SALT', () => {
    expect(parseEnv({ ...base, AI_ENABLED: 'true' }).error).toContain('falta AB_SALT');
    expect(parseEnv({ ...base, AI_ENABLED: 'true', AB_SALT: '' }).error).toContain('falta AB_SALT');
  });

  it('con AI_ENABLED=true y AB_SALT arranca', () => {
    expect(parseEnv({ ...base, AI_ENABLED: 'true', AB_SALT: 'sal-propia' }).env.AB_SALT).toBe('sal-propia');
  });

  it('no hay sal por defecto en el código', () => {
    expect(parseEnv({ ...base }).env.AB_SALT).toBeUndefined();
  });

  it('sin sal (IA apagada) no hay prueba A/B: todos ven "rules"', () => {
    expect(abVariant('cualquier-usuario', undefined)).toBe('rules');
  });
});
