import { vi } from 'vitest';

// Ninguna prueba debe salir a internet: el geocodificador (Nominatim) se simula en todas. Las pruebas de
// geocode.test.js usan createGeocoder con un fetch falso y sobrescriben este mock.
vi.mock('../src/services/geocode.service.js', async (importOriginal) => ({
  ...(await importOriginal()),
  searchPlaces: vi.fn(async () => []),
  locatePlace: vi.fn(async () => null),
}));

// Tampoco Gemini: la instancia de la app queda apagada (AI_ENABLED=false en vitest.config.js) y además se reemplaza
// por un cliente sin SDK. Las pruebas del cliente usan createGeminiClient con un SDK falso.
vi.mock('../src/services/ai/geminiClient.js', async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, gemini: original.createGeminiClient({ sdk: null, config: { enabled: false } }) };
});

// event_ai / user_ai: las pruebas de eventos y gustos no tocan la base real
vi.mock('../src/repositories/ai.repository.js', async (importOriginal) => ({
  ...(await importOriginal()),
  upsertEventAi: vi.fn(async () => {}),
  upsertUserAi: vi.fn(async () => {}),
  findEventTags: vi.fn(async () => []),
  listEventsForAi: vi.fn(async () => []),
  findEventAiByIds: vi.fn(async () => ({})),
  findUserEmbedding: vi.fn(async () => null),
  findCachedRecommendations: vi.fn(async () => null),
  saveCachedRecommendations: vi.fn(async () => {}),
  deleteCachedRecommendations: vi.fn(async () => {}),
  insertRecommendationEvents: vi.fn(async () => {}),
  findLikedSignals: vi.fn(async () => ({ categories: [], tags: [] })),
  findLatestShown: vi.fn(async () => null),
  listRecommendationEventsForMetrics: vi.fn(async () => []),
  listRatingsFor: vi.fn(async () => []),
  listPreferencesMissingAi: vi.fn(async () => []),
}));

// IA7 · search_events y match_event_embeddings: las pruebas no tocan la base real
vi.mock('../src/repositories/search.repository.js', () => ({
  matchEventEmbeddings: vi.fn(async () => []),
  findEventTagsByIds: vi.fn(async () => ({})),
  insertSearchEvent: vi.fn(async () => {}),
  markSearchOpened: vi.fn(async () => {}),
}));
