import * as attendanceService from '../services/attendance.service.js';

export async function confirmAttendance(req, res) {
  res.status(201).json({ data: await attendanceService.confirm(req.user, req.params.id) });
}

export async function cancelAttendance(req, res) {
  res.json({ data: await attendanceService.cancel(req.user, req.params.id) });
}
