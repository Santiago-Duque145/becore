import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { INTEREST_SLUGS } from '../src/constants/preferences.js';

// La migración de IA1 y el código deben decir lo mismo (como el check de gustos del onboarding)
const sql = await readFile(new URL('../../supabase/migrations/20261022160000_ai_recommendations.sql', import.meta.url), 'utf8');
const code = sql.replace(/--.*$/gm, ''); // sin comentarios
const slugsIn = (text) => [...text.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);

describe('migración ai_recommendations', () => {
  it('event_ai.tags acepta exactamente los slugs de INTERESTS, máximo 4', () => {
    const start = sql.indexOf('event_ai_tags_valid');
    expect(slugsIn(sql.slice(start, sql.indexOf('::text[]', start)))).toEqual(INTEREST_SLUGS);
    expect(code).toMatch(/cardinality\(tags\) <= 4/);
  });

  it('los vectores (768, gemini-embedding-2) viven en event_ai y user_ai, con índice HNSW por coseno en event_ai', () => {
    expect(code.match(/extensions\.vector\(768\)/g)).toHaveLength(2);
    expect(code).toMatch(/create index event_ai_embedding_hnsw on public\.event_ai using hnsw \(embedding extensions\.vector_cosine_ops\)/);
    expect(code).toMatch(/event_id\s+uuid primary key references public\.events \(id\) on delete cascade/);
  });

  it('no toca events ni user_preferences (events está en Realtime; user_preferences se lee desde el navegador)', () => {
    expect(code).not.toMatch(/alter table public\.(events|user_preferences)\b/);
  });

  it('event_ai y user_ai: RLS sin ninguna política y sin permisos para anon/authenticated', () => {
    for (const table of ['event_ai', 'user_ai']) {
      expect(code).toMatch(new RegExp(`alter table public\\.${table} enable row level security`));
      expect(code).toMatch(new RegExp(`revoke all on public\\.${table} from anon, authenticated`));
      expect(code).not.toMatch(new RegExp(`create policy \\w+ on public\\.${table}\\b`));
    }
  });

  it('caché y eventos de la A/B: RLS de solo lectura propia y ninguna política de escritura', () => {
    const policies = [...code.matchAll(/create policy \w+ on public\.(\w+)\s+for (\w+)/g)].map((m) => `${m[1]}:${m[2]}`);
    expect(policies).toEqual(['ai_recommendations:select', 'recommendation_events:select']);
  });

  it('no agrega tablas a la publicación de Realtime ni toca sexo, edad o consentimiento', () => {
    expect(code).not.toMatch(/publication/i);
    expect(code).not.toMatch(/gender|age_range|data_consent/);
  });
});

describe('migración recommendation_source (IA3)', () => {
  it('recommendation_events.source: gemini, template o rules, obligatorio', async () => {
    const src = (await readFile(new URL('../../supabase/migrations/20261022170000_recommendation_source.sql', import.meta.url), 'utf8')).replace(
      /--.*$/gm,
      '',
    );
    expect(src).toMatch(/add column source text not null check \(source in \('gemini', 'template', 'rules'\)\)/);
    expect(src).not.toMatch(/create policy|publication|gender|age_range/);
  });
});
