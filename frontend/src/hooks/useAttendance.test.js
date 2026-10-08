import { describe, expect, it } from 'vitest';
import { applyAttendance } from './useAttendance.js';

const event = { capacity: 10, confirmedCount: 9, availableSpots: 1, isFull: false, myAttendance: null };

describe('applyAttendance', () => {
  it('confirmar suma un cupo ocupado y marca lleno al llegar al máximo', () => {
    expect(applyAttendance(event, true)).toMatchObject({
      confirmedCount: 10,
      availableSpots: 0,
      isFull: true,
      myAttendance: { status: 'confirmed', checkedIn: false },
    });
  });

  it('cancelar libera un cupo', () => {
    const full = { ...event, confirmedCount: 10, availableSpots: 0, isFull: true };
    expect(applyAttendance(full, false)).toMatchObject({ confirmedCount: 9, availableSpots: 1, isFull: false });
  });
});
