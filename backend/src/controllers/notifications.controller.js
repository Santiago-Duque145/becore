import * as inbox from '../services/inbox.service.js';

export async function listNotifications(req, res) {
  const { data, meta } = await inbox.listInbox(req.user, req.validatedQuery.limit);
  res.json({ data, meta });
}

export async function unreadCount(req, res) {
  res.json({ data: { count: await inbox.countUnread(req.user) } });
}

export async function markRead(req, res) {
  res.json({ data: await inbox.markRead(req.user, req.params.id) });
}

export async function markAllRead(req, res) {
  res.json({ data: await inbox.markAllRead(req.user) });
}
