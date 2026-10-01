import app from './app.js';
import { env } from './config/env.js';

app.listen(env.PORT, () => {
  console.info(`[server] API corriendo en http://localhost:${env.PORT}`);
});
