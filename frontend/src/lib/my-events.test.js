import { describe, it, expect } from 'vitest';
import { groupNotifications, myEventStatus, pendingScheduleChanges } from './my-events.js';

describe('myEventStatus', () => {
  it('evento cancelado gana a todo', () => {
    expect(myEventStatus({ status: 'cancelled', myAttendance: { status: 'confirmed', checkedIn: true } }).label).toBe(
      'Evento cancelado',
    );
  });

  it('cancelado por mí, asistió y confirmado', () => {
    expect(myEventStatus({ status: 'published', myAttendance: { status: 'cancelled' } }).label).toBe('Cancelado');
    expect(myEventStatus({ status: 'finished', myAttendance: { status: 'confirmed', checkedIn: true } }).label).toBe('Asistió');
    expect(myEventStatus({ status: 'published', myAttendance: { status: 'confirmed', checkedIn: false } }).label).toBe(
      'Confirmado',
    );
  });
});

describe('groupNotifications', () => {
  // 12 oct 2026, 9:00 a. m. en Bogotá
  const now = new Date('2026-10-12T14:00:00.000Z');
  const at = (iso) => ({ id: iso, createdAt: iso });

  it('Hoy usa el día de Bogotá, no el de UTC', () => {
    // 12 oct 0:30 a. m. Bogotá (aún 12 en UTC) y 11 oct 11:30 p. m. Bogotá (ya 12 en UTC)
    const groups = groupNotifications([at('2026-10-12T05:30:00.000Z'), at('2026-10-12T04:30:00.000Z')], now);
    expect(groups.map((g) => [g.label, g.items.length])).toEqual([
      ['Hoy', 1],
      ['Esta semana', 1],
    ]);
  });

  it('Esta semana = hasta 6 días atrás; después, Antes; sin grupos vacíos', () => {
    const groups = groupNotifications([at('2026-10-06T15:00:00.000Z'), at('2026-10-05T15:00:00.000Z')], now);
    expect(groups.map((g) => [g.label, g.items.length])).toEqual([
      ['Esta semana', 1],
      ['Antes', 1],
    ]);
  });
});

describe('pendingScheduleChanges', () => {
  it('solo event_updated sin leer de mis próximos eventos', () => {
    const notifications = [
      { id: 1, type: 'event_updated', readAt: null, eventId: 'e1' },
      { id: 2, type: 'event_updated', readAt: '2026-10-12', eventId: 'e1' },
      { id: 3, type: 'event_reminder', readAt: null, eventId: 'e1' },
      { id: 4, type: 'event_updated', readAt: null, eventId: 'viejo' },
    ];
    expect(pendingScheduleChanges(notifications, [{ id: 'e1' }]).map((n) => n.id)).toEqual([1]);
  });
});
