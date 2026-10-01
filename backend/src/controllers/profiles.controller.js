import { updateProfile } from '../repositories/profiles.repository.js';
import { AppError } from '../utils/app-error.js';

export async function getMe(req, res) {
  res.json({ data: req.user });
}

export async function patchMe(req, res) {
  const updated = await updateProfile(req.user.id, req.body);
  if (!updated) throw new AppError(404, 'NOT_FOUND', 'No encontramos lo que buscas');
  res.json({ data: updated });
}
