import { vi } from 'vitest';

// Ninguna prueba debe salir a internet: el geocodificador (Nominatim) se simula en todas. Las pruebas de
// geocode.test.js usan createGeocoder con un fetch falso y sobrescriben este mock.
vi.mock('../src/services/geocode.service.js', async (importOriginal) => ({
  ...(await importOriginal()),
  searchPlaces: vi.fn(async () => []),
  locatePlace: vi.fn(async () => null),
}));
