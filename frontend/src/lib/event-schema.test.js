import { describe, it, expect } from 'vitest';
import { durationLabel, eventFormSchema, eventToFormValues, formValuesToPayload } from './event-schema.js';

const values = {
  title: '  Partido 5v5 ',
  description: '',
  category: 'sport',
  location: 'Cancha Estadio',
  startsAt: '2030-10-31T15:00',
  durationMinutes: '',
  capacity: '12',
};

describe('formValuesToPayload', () => {
  it('sin duración no envía endsAt', () => {
    expect(formValuesToPayload(values)).toEqual({
      title: 'Partido 5v5',
      description: '',
      category: 'sport',
      location: 'Cancha Estadio',
      startsAt: '2030-10-31T20:00:00.000Z',
      capacity: 12,
    });
  });

  it('con duración calcula endsAt', () => {
    expect(formValuesToPayload({ ...values, durationMinutes: '90' }).endsAt).toBe('2030-10-31T21:30:00.000Z');
  });
});

describe('eventToFormValues', () => {
  it('deriva la duración desde endsAt', () => {
    const form = eventToFormValues({
      title: 'x',
      description: null,
      category: 'culture',
      location: 'Casa',
      startsAt: '2030-10-31T20:00:00.000Z',
      endsAt: '2030-10-31T22:15:00.000Z',
      capacity: 30,
    });
    expect(form).toMatchObject({ startsAt: '2030-10-31T15:00', durationMinutes: '135', description: '' });
    expect(durationLabel(135)).toBe('2 h 15 min');
    expect(durationLabel(90)).toBe('1 hora y media');
  });
});

describe('eventFormSchema', () => {
  it('pide fecha futura, categoría y cupo entre 1 y 1000', () => {
    const result = eventFormSchema.safeParse({ ...values, category: '', startsAt: '2020-01-01T10:00', capacity: '0' });
    const fields = result.error.issues.map((i) => i.path[0]);
    expect(fields).toEqual(expect.arrayContaining(['category', 'startsAt', 'capacity']));
  });
});

describe('eventFormSchema con campos vacíos', () => {
  it('no revienta con la fecha vacía (refine después de min)', () => {
    const result = eventFormSchema.safeParse({ ...values, title: '', startsAt: '' });
    expect(result.success).toBe(false);
    expect(result.error.issues.find((i) => i.path[0] === 'startsAt').message).toBe('Elige la fecha y la hora');
  });
});
