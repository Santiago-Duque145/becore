import * as attendanceRepo from '../repositories/attendance.repository.js';

export async function confirm(user, eventId) {
  const confirmedCount = await attendanceRepo.confirmAttendance(eventId, user.id);
  return { confirmedCount, myAttendance: { status: 'confirmed', checkedIn: false } };
}

export async function cancel(user, eventId) {
  const confirmedCount = await attendanceRepo.cancelAttendance(eventId, user.id);
  return { confirmedCount, myAttendance: { status: 'cancelled', checkedIn: false } };
}
