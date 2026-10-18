import { describe, it, expect } from 'vitest';
import { capacityText } from './capacity.js';

describe('capacityText', () => {
  it('confirmados y cupos disponibles por separado', () =>
    expect(capacityText(1, 5)).toEqual({ confirmed: 'Confirmados 1 de 5', available: '4 cupos disponibles', isFull: false }));
  it('singular cuando queda uno', () => expect(capacityText(4, 5).available).toBe('1 cupo disponible'));
  it('cupo lleno', () => expect(capacityText(5, 5)).toMatchObject({ available: 'Cupo lleno', isFull: true }));
  it('nunca baja de cero', () => expect(capacityText(7, 5).available).toBe('Cupo lleno'));
});
