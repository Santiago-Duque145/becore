import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/repositories/attendance.repository.js', () => ({
  confirmAttendance: vi.fn(),
  cancelAttendance: vi.fn(),
}));

import * as repo from '../src/repositories/attendance.repository.js';
import * as service from '../src/services/attendance.service.js';
import { AppError } from '../src/utils/app-error.js';

const user = { id: 'par-1', role: 'participant' };
const fail = (status, code) => new AppError(status, code, 'msg');

beforeEach(() => vi.clearAllMocks());

describe('confirm', () => {
  it('confirma y devuelve el nuevo confirmedCount', async () => {
    repo.confirmAttendance.mockResolvedValue(5);
    await expect(service.confirm(user, 'ev-1')).resolves.toEqual({
      confirmedCount: 5,
      myAttendance: { status: 'confirmed', checkedIn: false },
    });
    expect(repo.confirmAttendance).toHaveBeenCalledWith('ev-1', 'par-1');
  });

  it.each([
    ['EVENT_FULL', 409],
    ['ALREADY_CONFIRMED', 409],
    ['EVENT_STARTED', 409],
    ['EVENT_NOT_ACTIVE', 409],
    ['EVENT_NOT_FOUND', 404],
  ])('propaga %s', async (code, status) => {
    repo.confirmAttendance.mockRejectedValue(fail(status, code));
    await expect(service.confirm(user, 'ev-1')).rejects.toMatchObject({ code, status });
  });
});

describe('cancel', () => {
  it('cancela y devuelve el nuevo confirmedCount', async () => {
    repo.cancelAttendance.mockResolvedValue(3);
    await expect(service.cancel(user, 'ev-1')).resolves.toEqual({
      confirmedCount: 3,
      myAttendance: { status: 'cancelled', checkedIn: false },
    });
    expect(repo.cancelAttendance).toHaveBeenCalledWith('ev-1', 'par-1');
  });

  it.each([
    ['NOT_CONFIRMED', 409],
    ['EVENT_STARTED', 409],
    ['EVENT_NOT_ACTIVE', 409],
    ['EVENT_NOT_FOUND', 404],
  ])('propaga %s', async (code, status) => {
    repo.cancelAttendance.mockRejectedValue(fail(status, code));
    await expect(service.cancel(user, 'ev-1')).rejects.toMatchObject({ code, status });
  });
});
