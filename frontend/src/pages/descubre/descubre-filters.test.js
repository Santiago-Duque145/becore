import { describe, it, expect } from 'vitest';
import { emptyTitle, isApiSearch, matchesSearch } from './descubre-filters.js';

describe('matchesSearch', () => {
  const event = { title: 'Torneo de fútbol', location: 'Cancha de Belén' };

  it('sin texto deja pasar todo', () => {
    expect(matchesSearch(event, '  ')).toBe(true);
  });

  it('busca en título y lugar sin tildes ni mayúsculas', () => {
    expect(matchesSearch(event, 'FUTBOL')).toBe(true);
    expect(matchesSearch(event, 'belen')).toBe(true);
    expect(matchesSearch(event, 'teatro')).toBe(false);
  });
});

describe('emptyTitle', () => {
  it('por categoría', () => {
    expect(emptyTitle('culture', '')).toBe('No hay eventos de cultura por ahora. ¡Vuelve pronto!');
    expect(emptyTitle('recreation', '')).toBe('No hay eventos de recreación por ahora. ¡Vuelve pronto!');
  });

  it('sin filtro y con búsqueda', () => {
    expect(emptyTitle('', '')).toBe('Todavía no hay eventos próximos.');
    expect(emptyTitle('sport', ' zumba ')).toBe('No encontramos planes así.');
  });
});

describe('isApiSearch', () => {
  it('desde 2 letras (sin contar espacios) busca la API', () => {
    expect(isApiSearch('f')).toBe(false);
    expect(isApiSearch(' f ')).toBe(false);
    expect(isApiSearch('fu')).toBe(true);
  });
});
