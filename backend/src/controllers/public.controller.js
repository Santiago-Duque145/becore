import { CACHE_TTL_MS, getPublicStats } from '../services/public-stats.service.js';

export async function publicStats(_req, res) {
  const data = await getPublicStats();
  res.set('Cache-Control', `public, max-age=${CACHE_TTL_MS / 1000}`);
  res.json({ data });
}
