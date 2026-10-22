import { describe, it, expect, vi } from 'vitest';
import { candidateQueries, createGeocoder } from '../src/services/geocode.service.js';

// Ubicar el texto de un lugar con Nominatim simulado (corrección tras P6)
const viva = { display_name: 'Viva Envigado, Envigado', lat: '6.1762915', lon: '-75.5916923' };
const fakeFetch = (rows = [viva], ok = true) => vi.fn(async () => ({ ok, status: ok ? 200 : 503, json: async () => rows }));

describe('candidateQueries', () => {
  it('el texto completo y luego versiones sin las primeras palabras', () => {
    expect(candidateQueries('Sala 4 IMAX Centro Comercial Viva Envigado')).toEqual([
      'Sala 4 IMAX Centro Comercial Viva Envigado',
      '4 IMAX Centro Comercial Viva Envigado',
      'IMAX Centro Comercial Viva Envigado',
      'Centro Comercial Viva Envigado',
    ]);
  });
  it('un lugar de dos palabras o menos solo se prueba completo', () => {
    expect(candidateQueries('Parque Sabaneta')).toEqual(['Parque Sabaneta']);
    expect(candidateQueries('Estadio')).toEqual(['Estadio']);
  });
  it('texto vacío no genera consultas y el máximo se respeta', () => {
    expect(candidateQueries('   ')).toEqual([]);
    expect(candidateQueries('uno dos tres cuatro cinco seis siete', 2)).toHaveLength(2);
  });
});

describe('locate', () => {
  it('el caso real: el texto completo no existe en Nominatim pero "Centro Comercial Viva Envigado" sí', async () => {
    const fetchImpl = vi.fn(async (url) => ({
      ok: true,
      json: async () => (url.searchParams.get('q') === 'Centro Comercial Viva Envigado' ? [viva] : []),
    }));
    const { locate } = createGeocoder({ fetchImpl, sleep: async () => {} });
    const hit = await locate('Sala 4 IMAX Centro Comercial Viva Envigado');
    expect(hit).toMatchObject({ lat: 6.1762915, lng: -75.5916923, query: 'Centro Comercial Viva Envigado' });
    expect(fetchImpl).toHaveBeenCalledTimes(4); // nunca más de 4 intentos
  });

  it('se detiene en la primera versión que encuentra algo', async () => {
    const fetchImpl = fakeFetch([viva]);
    const { locate } = createGeocoder({ fetchImpl, sleep: async () => {} });
    await locate('Parque Sabaneta Centro');
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('sin resultados en ninguna versión devuelve null (no lanza)', async () => {
    const { locate } = createGeocoder({ fetchImpl: fakeFetch([]), sleep: async () => {} });
    await expect(locate('Cancha de prueba, Medellín')).resolves.toBeNull();
  });

  it('si Nominatim está caído devuelve null y no insiste con las demás versiones', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchImpl = fakeFetch([], false);
    const { locate } = createGeocoder({ fetchImpl, sleep: async () => {} });
    await expect(locate('Sala 4 IMAX Centro Comercial Viva Envigado')).resolves.toBeNull();
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('un texto vacío no sale a internet', async () => {
    const fetchImpl = fakeFetch();
    const { locate } = createGeocoder({ fetchImpl, sleep: async () => {} });
    await expect(locate('   ')).resolves.toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
