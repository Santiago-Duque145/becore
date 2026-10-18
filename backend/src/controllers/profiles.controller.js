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

export async function putConsent(req, res) {
  res.json({ data: await meService.acceptDataConsent(req.user, req.body) });
}

export async function putPreferences(req, res) {
  res.json({ data: await meService.updatePreferences(req.user, req.body) });
}

export async function postAvatarUploadUrl(req, res) {
  res.status(201).json({ data: await meService.createAvatarUpload(req.user, req.body.contentType) });
}

export async function putAvatar(req, res) {
  res.json({ data: await meService.setAvatarPhoto(req.user, req.body.path) });
}

export async function putAvatarPreset(req, res) {
  res.json({ data: await meService.setAvatarPreset(req.user, req.body.preset) });
}

export async function deleteAvatar(req, res) {
  res.json({ data: await meService.clearAvatar(req.user) });
}
