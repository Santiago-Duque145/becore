import * as meService from '../services/me.service.js';

export async function getMe(req, res) {
  res.json({ data: await meService.getMe(req.user) });
}

export async function patchMe(req, res) {
  res.json({ data: await meService.updateName(req.user, req.body) });
}

export async function putOnboarding(req, res) {
  res.json({ data: await meService.completeOnboarding(req.user, req.body) });
}

export async function putPreferences(req, res) {
  res.json({ data: await meService.updatePreferences(req.user, req.body) });
}
