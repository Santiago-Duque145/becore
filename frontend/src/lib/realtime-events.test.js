import { describe, it, expect } from 'vitest';
import { applyEventRow, patchCachedEvents } from './realtime-events.js';

const event = (id, confirmedCount = 1) => ({ id, title: id, capacity: 5, confirmedCount, availableSpots: 5 - confirmedCount, isFull: false, organizer: { id: 'o' } });
const row = (id, confirmed_count, extra = {}) => ({ id, capacity: 5, confirmed_count, status: 'published', ...extra });

describe('applyEventRow', () => {
  it('actualiza cupo y estado y recalcula los disponibles', () => {
    const next = applyEventRow(event('a', 1), row('a', 3));
    expect(next).toMatchObject({ confirmedCount: 3, availableSpots: 2, isFull: false });
  });
  it('marca el cupo lleno', () => expect(applyEventRow(event('a'), row('a', 5))).toMatchObject({ availableSpots: 0, isFull: true }));
  it('conserva lo que Realtime no trae', () => expect(applyEventRow(event('a'), row('a', 2)).organizer).toEqual({ id: 'o' }));
  it('si el cupo baja del número de confirmados no queda negativo', () =>
    expect(applyEventRow(event('a'), row('a', 9)).availableSpots).toBe(0));
});

describe('patchCachedEvents', () => {
  const infinite = { pages: [{ data: [event('a'), event('b')] }, { data: [event('c')] }], pageParams: [1, 2] };

  it('parcha solo el evento con ese id dentro de las páginas', () => {
    const next = patchCachedEvents(infinite, row('c', 4));
    expect(next.pages[1].data[0].confirmedCount).toBe(4);
    expect(next.pages[0].data[0]).toBe(infinite.pages[0].data[0]);
    expect(next.pageParams).toEqual([1, 2]);
  });
  it('parcha un evento suelto (detalle)', () => expect(patchCachedEvents(event('a'), row('a', 2)).confirmedCount).toBe(2));
  it('deja igual lo que no coincide', () => {
    const single = event('a');
    expect(patchCachedEvents(single, row('z', 2))).toBe(single);
    expect(patchCachedEvents([event('a')], row('a', 2))).toEqual([event('a')]);
    expect(patchCachedEvents(undefined, row('a', 2))).toBeUndefined();
  });
});
