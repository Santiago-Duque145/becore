import { describe, it, expect } from 'vitest';
import { canEditEvent, eventRowStatus, statTags } from './organizer-ui.js';

const ev = (over = {}) => ({ status: 'published', isPast: false, capacity: 10, confirmedCount: 2, startsAt: '2026-10-13T00:00:00Z', ...over });

describe('eventRowStatus', () => {
  it('cada estado con su texto', () => {
    expect(eventRowStatus(ev({ status: 'cancelled' }))[0]).toBe('Cancelado');
    expect(eventRowStatus(ev({ status: 'draft' }))[0]).toBe('Borrador');
    expect(eventRowStatus(ev({ status: 'finished', isPast: true }))[0]).toBe('Finalizado');
    expect(eventRowStatus(ev({ status: 'in_progress', isPast: true }))[0]).toBe('En curso');
    expect(eventRowStatus(ev({ confirmedCount: 10 }))[0]).toBe('Lleno');
    expect(eventRowStatus(ev({ confirmedCount: 8 }))[0]).toBe('Casi lleno');
    expect(eventRowStatus(ev())[0]).toBe('Activo');
  });
});

describe('canEditEvent', () => {
  it('solo borradores y publicados futuros', () => {
    expect(canEditEvent(ev())).toBe(true);
    expect(canEditEvent(ev({ status: 'draft' }))).toBe(true);
    expect(canEditEvent(ev({ isPast: true }))).toBe(false);
    expect(canEditEvent(ev({ status: 'cancelled' }))).toBe(false);
  });
});

describe('statTags', () => {
  it('cuenta los de esta semana y los casi llenos entre los activos', () => {
    const now = new Date('2026-10-12T12:00:00Z').getTime();
    const events = [
      ev({ startsAt: '2026-10-13T00:00:00Z', confirmedCount: 9 }),
      ev({ startsAt: '2026-10-30T00:00:00Z' }),
      ev({ status: 'cancelled', startsAt: '2026-10-13T00:00:00Z' }),
    ];
    expect(statTags({ totals: { checkedIn: 1 }, events }, now)).toEqual({
      active: '1 esta semana',
      confirmed: '1 llegó',
      occupancy: '1 evento casi lleno',
      cancelled: 'últimos 30 días',
    });
  });
});
