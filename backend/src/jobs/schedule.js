import cron from 'node-cron';
import { runRemindersOnce } from './reminders.job.js';
import { runStatusRefreshOnce } from './event-status.job.js';

const TIMEZONE = 'America/Bogota';

// Un fallo del job se registra y no tumba el proceso
const safe = (name, job) => async () => {
  try {
    await job();
  } catch (err) {
    console.error(`[${name}] Error:`, err.message);
  }
};

export function startJobs() {
  cron.schedule('*/15 * * * *', safe('recordatorios', runRemindersOnce), { timezone: TIMEZONE });
  cron.schedule('* * * * *', safe('estados', runStatusRefreshOnce), { timezone: TIMEZONE });
  console.info('[cron] Recordatorios (cada 15 min) y estados de eventos (cada minuto) activos');
}
