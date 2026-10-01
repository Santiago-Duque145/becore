import { runRemindersOnce } from '../src/jobs/reminders.job.js';

runRemindersOnce()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[reminders] Error:', err.message);
    process.exit(1);
  });
