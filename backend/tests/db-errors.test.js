import { describe, expect, it } from 'vitest';
import { translateDbError } from '../src/utils/db-errors.js';

const CODES = {
  EVENT_NOT_FOUND: 404,
  FORBIDDEN: 403,
  EVENT_FULL: 409,
  ALREADY_CONFIRMED: 409,
  NOT_CONFIRMED: 409,
  EVENT_NOT_ACTIVE: 409,
  EVENT_STARTED: 409,
  CHECKIN_NOT_OPEN: 409,
  APPOINTMENT_NOT_ACTIVE: 409,
  INVALID_EVENT_TRANSITION: 409,
  INVALID_INITIAL_STATUS: 409,
};

describe('translateDbError', () => {
  it.each(Object.entries(CODES))('traduce %s a HTTP %i', (code, status) => {
    const err = translateDbError({ message: code });
    expect(err.status).toBe(status);
    expect(err.code).toBe(code);
    expect(err.message).toBeTruthy();
  });

  it('reconoce el código de un trigger aunque traiga sufijo y errcode 23514', () => {
    const err = translateDbError({ code: '23514', message: 'INVALID_EVENT_TRANSITION: draft -> finished' });
    expect(err.status).toBe(409);
    expect(err.code).toBe('INVALID_EVENT_TRANSITION');
    expect(translateDbError({ code: '23514', message: 'INVALID_INITIAL_STATUS: finished' }).code).toBe(
      'INVALID_INITIAL_STATUS',
    );
  });

  it('detecta CAPACITY_BELOW_CONFIRMED por constraint_name', () => {
    const err = translateDbError({ code: '23514', constraint_name: 'events_confirmed_within_capacity', message: 'x' });
    expect(err.code).toBe('CAPACITY_BELOW_CONFIRMED');
  });

  it('detecta CAPACITY_BELOW_CONFIRMED por message', () => {
    const err = translateDbError({
      code: '23514',
      message: 'new row violates check constraint "events_confirmed_within_capacity"',
    });
    expect(err.code).toBe('CAPACITY_BELOW_CONFIRMED');
  });

  it('otro check → CONSTRAINT_VIOLATION', () => {
    expect(translateDbError({ code: '23514', message: 'otra regla' }).code).toBe('CONSTRAINT_VIOLATION');
  });

  it('23505 → DUPLICATE', () => {
    const err = translateDbError({ code: '23505', message: 'duplicate key' });
    expect(err.status).toBe(409);
    expect(err.code).toBe('DUPLICATE');
  });

  it('error desconocido o vacío → null', () => {
    expect(translateDbError({ code: 'XX000', message: 'boom' })).toBeNull();
    expect(translateDbError(null)).toBeNull();
  });
});
