import * as repo from '../repositories/notifications.repository.js';
import { AppError } from '../utils/app-error.js';

// Bandeja de avisos de la app (tabla notifications: message y read_at). El envío por correo vive en
// notifications.service.js; aquí solo se lee y se marca como leído.

export async function listInbox(user, limit) {
  const [data, unread] = await Promise.all([repo.listInbox(user.id, limit), repo.countUnread(user.id)]);
  return { data, meta: { unread } };
}

export const countUnread = (user) => repo.countUnread(user.id);

export async function markRead(user, id) {
  const item = await repo.markRead(user.id, id);
  // Las de otro usuario "no existen" para este
  if (!item) throw new AppError(404, 'NOT_FOUND', 'No encontramos lo que buscas');
  return item;
}

export async function markAllRead(user) {
  return { updated: await repo.markAllRead(user.id) };
}
