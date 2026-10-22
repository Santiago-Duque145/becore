import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { INTEREST_SLUGS } from '../../constants/preferences.js';
import { INTEREST_QUERIES, interestQueryText } from './prompts.js';

// Etiquetas de un evento SIN el modelo de texto (IA3, decisión del 22 oct): se compara el embedding del evento con el
// de cada uno de los 18 gustos y se asignan hasta 4 por encima del umbral. Solo usa el modelo de embeddings, que tiene
// su propio cupo; todo el cupo de texto queda para el re-ordenado de "Para ti".
//
// Umbral elegido con 32 eventos etiquetados a mano (10 reales + 22 ficticios), docs/progreso/18_* §5:
// - similitud de los gustos correctos: mín. 0,623 · mediana 0,732 · máx. 0,809
// - similitud de los incorrectos:      mediana 0,611 · p95 0,664 · máx. 0,703
// - TAG_THRESHOLD 0,68 + TAG_MARGIN 0,04 (no más de 0,04 por debajo del mejor gusto): precisión 1,00, recall 0,78,
//   24 de 32 exactos. Entre 0,66 y 0,69 el F1 se mantiene ≥ 0,85. Se prefirió no equivocarse a etiquetar todo.
export const TAG_THRESHOLD = 0.68;
export const TAG_MARGIN = 0.04;
export const MAX_EVENT_TAGS = 4;

// Producto punto = similitud coseno (gemini-embedding-2 devuelve vectores normalizados)
export const cosine = (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0);

// Función pura: { slug: vector } + vector del evento → gustos ordenados de más a menos parecido
export function tagsFromEmbedding(embedding, interestVectors, { threshold = TAG_THRESHOLD, margin = TAG_MARGIN } = {}) {
  const sims = INTEREST_SLUGS.filter((slug) => interestVectors[slug]).map((slug) => [slug, cosine(embedding, interestVectors[slug])]);
  if (!sims.length) return [];
  const best = Math.max(...sims.map(([, s]) => s));
  return sims
    .filter(([, s]) => s >= threshold && s >= best - margin)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_EVENT_TAGS)
    .map(([slug]) => slug);
}

// ---------- Caché de los 18 embeddings: memoria + archivo local (.cache/, fuera de git) ----------
const CACHE_FILE = new URL('../../../.cache/interest-embeddings.json', import.meta.url);

// La caché vale mientras no cambien el modelo ni los textos de los gustos
export const interestCacheKey = (model) =>
  createHash('sha256').update(`${model}\n${JSON.stringify(INTEREST_QUERIES)}`).digest('hex').slice(0, 16);

const memory = new Map(); // key → Promise<{ slug: vector }>

async function readFileCache(key, fs) {
  try {
    const cached = JSON.parse(await fs.readFile(CACHE_FILE, 'utf8'));
    return cached.key === key && INTEREST_SLUGS.every((s) => cached.vectors?.[s]?.length) ? cached.vectors : null;
  } catch {
    return null;
  }
}

async function compute(client, key, fs) {
  const fromFile = await readFileCache(key, fs);
  if (fromFile) return fromFile;
  const vectors = {};
  for (const slug of INTEREST_SLUGS) vectors[slug] = await client.embedText(interestQueryText(slug), { timeoutMs: 20_000, retry: true });
  try {
    await fs.mkdir(new URL('.', CACHE_FILE), { recursive: true });
    await fs.writeFile(CACHE_FILE, JSON.stringify({ key, vectors }));
  } catch {
    // sin disco escribible la caché en memoria basta
  }
  return vectors;
}

// Una sola vez por proceso (y por modelo); si falla, se reintenta en la próxima llamada
export function getInterestVectors(client, model, fs = { readFile, writeFile, mkdir }) {
  const key = interestCacheKey(model);
  if (!memory.has(key)) {
    const pending = compute(client, key, fs).catch((error) => {
      memory.delete(key);
      throw error;
    });
    memory.set(key, pending);
  }
  return memory.get(key);
}

export const clearInterestVectorsMemory = () => memory.clear();
