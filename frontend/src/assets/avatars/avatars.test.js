import { readFile } from 'node:fs/promises';
import { describe, it, expect } from 'vitest';
import { AVATAR_PRESET_IDS } from './index.jsx';

describe('avatares predefinidos', () => {
  it('son 12 y coinciden con los del backend', async () => {
    const src = await readFile(new URL('../../../../backend/src/constants/avatars.js', import.meta.url), 'utf8');
    const backend = [...src.match(/AVATAR_PRESETS = \[([^\]]+)\]/)[1].matchAll(/'([a-z]+)'/g)].map((m) => m[1]);
    expect(AVATAR_PRESET_IDS).toHaveLength(12);
    expect(AVATAR_PRESET_IDS).toEqual(backend);
  });

  it('coinciden con el check de la migración', async () => {
    const sql = await readFile(
      new URL('../../../../supabase/migrations/20261022130000_avatars_and_covers.sql', import.meta.url),
      'utf8',
    );
    const inDb = [...sql.match(/avatar_preset in \(([^)]+)\)/)[1].matchAll(/'([a-z]+)'/g)].map((m) => m[1]);
    expect(AVATAR_PRESET_IDS).toEqual(inDb);
  });
});
