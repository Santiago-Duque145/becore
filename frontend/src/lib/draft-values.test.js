import { describe, expect, it } from 'vitest';
import { draftToFormValues, draftUnavailableMessage } from './draft-values.js';

describe('draftToFormValues', () => {
  it('convierte el borrador completo a valores del formulario (hora de Bogotá, textos)', () => {
    const { values, place } = draftToFormValues({
      title: 'Micro en Belén',
      description: 'Partido para principiantes.',
      category: 'sport',
      startsAt: '2026-10-24T21:00:00.000Z',
      durationMinutes: 90,
      capacity: 12,
      location: 'Parque de Belén',
      latitude: 6.23,
      longitude: -75.6,
    });
    expect(values).toEqual({
      title: 'Micro en Belén',
      description: 'Partido para principiantes.',
      category: 'sport',
      startsAt: '2026-10-24T16:00',
      durationMinutes: '90',
      capacity: '12',
      location: 'Parque de Belén',
    });
    expect(place).toEqual({ lat: 6.23, lng: -75.6 });
  });

  it('deja intactos los campos que el borrador trae vacíos y no inventa pin', () => {
    const { values, place } = draftToFormValues({
      title: 'Cine al parque',
      description: '',
      category: 'culture',
      startsAt: null,
      durationMinutes: null,
      capacity: null,
      location: '',
      latitude: null,
      longitude: null,
    });
    expect(Object.keys(values)).toEqual(['title', 'category']);
    expect(place).toBeUndefined();
  });
});

describe('draftUnavailableMessage', () => {
  it('mensaje propio para el límite diario y el general para el resto', () => {
    expect(draftUnavailableMessage('DAILY_LIMIT')).toMatch(/límite/);
    expect(draftUnavailableMessage('AI_DISABLED')).toBe('El asistente no está disponible ahora; puedes llenar el formulario normal.');
    expect(draftUnavailableMessage(undefined)).toMatch(/no está disponible/);
  });
});
