import app from './app.js';
import { env } from './config/env.js';
import { startJobs } from './jobs/schedule.js';

app.listen(env.PORT, () => {
  console.info(`[server] API corriendo en http://localhost:${env.PORT}`);
});

if (env.CRON_ENABLED === 'true' && env.NODE_ENV !== 'test') startJobs();
