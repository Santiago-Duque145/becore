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
