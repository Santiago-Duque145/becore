import * as attendanceService from '../services/attendance.service.js';

export async function confirmAttendance(req, res) {
  res.status(201).json({ data: await attendanceService.confirm(req.user, req.params.id) });
}

export async function cancelAttendance(req, res) {
  res.json({ data: await attendanceService.cancel(req.user, req.params.id) });
}

export async function listAttendees(req, res) {
  res.json({ data: await attendanceService.listAttendees(req.user, req.params.id) });
}

export async function setCheckIn(req, res) {
  const { id, userId } = req.params;
  res.json({ data: await attendanceService.setCheckIn(req.user, id, userId, req.body.checkedIn) });
}

export async function listActivity(req, res) {
  const { limit } = req.validatedQuery;
  res.json({ data: await attendanceService.listActivity(req.user, req.params.id, limit) });
}
