import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { INTEREST_SLUGS } from '../src/constants/preferences.js';

// La migración de IA1 y el código deben decir lo mismo (como el check de gustos del onboarding)
const sql = await readFile(new URL('../../supabase/migrations/20261022160000_ai_recommendations.sql', import.meta.url), 'utf8');
const slugsIn = (text) => [...text.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);

describe('migración ai_recommendations', () => {
  it('events.tags acepta exactamente los slugs de INTERESTS, máximo 4', () => {
    const check = sql.slice(sql.indexOf('events_tags_valid'), sql.indexOf('::text[]', sql.indexOf('events_tags_valid')));
    expect(slugsIn(check)).toEqual(INTEREST_SLUGS);
    expect(sql).toMatch(/cardinality\(tags\) <= 4/);
  });

  it('embeddings de 768 dimensiones (gemini-embedding-2) en eventos y perfiles, con índice HNSW por coseno', () => {
    expect(sql.match(/extensions\.vector\(768\)/g)).toHaveLength(2);
    expect(sql).toMatch(/using hnsw \(embedding extensions\.vector_cosine_ops\)/);
  });

  it('las tablas nuevas tienen RLS de solo lectura propia y ninguna política de escritura', () => {
    expect(sql.match(/enable row level security/g)).toHaveLength(2);
    const policies = [...sql.matchAll(/create policy \w+ on public\.\w+\s+for (\w+)/g)].map((m) => m[1]);
    expect(policies).toEqual(['select', 'select']);
  });

  it('no toca sexo, edad ni consentimiento', () => {
    const code = sql.replace(/--.*$/gm, '');
    expect(code).not.toMatch(/gender|age_range|data_consent/);
  });
});
