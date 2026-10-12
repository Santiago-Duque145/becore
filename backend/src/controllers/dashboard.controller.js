import { getOrganizerDashboard, getParticipantDashboard } from '../services/dashboard.service.js';

export async function participantDashboard(req, res) {
  res.json({ data: await getParticipantDashboard(req.user) });
}

export async function organizerDashboard(req, res) {
  res.json({ data: await getOrganizerDashboard(req.user) });
}
