import { refreshEventStatuses } from '../repositories/events.repository.js';

export async function runStatusRefreshOnce() {
  const updated = await refreshEventStatuses();
  if (updated > 0) console.info(`[estados] actualizados=${updated}`);
  return updated;
}
